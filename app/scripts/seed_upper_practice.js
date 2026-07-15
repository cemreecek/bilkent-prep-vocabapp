const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const listId = "upper-intermediate-list"
  
  // Ensure VocabList exists
  let list = await prisma.vocabList.findUnique({ where: { id: listId } })
  if (!list) {
    list = await prisma.vocabList.create({
      data: {
        id: listId,
        level: "UpperIntermediate",
        unit: "Spring Semester"
      }
    })
    console.log("Created VocabList")
  } else {
    // Delete existing questions to re-seed cleanly
    await prisma.practiceQuestion.deleteMany({ where: { listId: listId } })
    console.log("Cleared existing practice questions for this list")
  }

  const practicesDir = path.join(__dirname, '..', 'public', 'data', 'practices')
  
  for (let week = 1; week <= 8; week++) {
    const filePath = path.join(practicesDir, `upper-set-${week}.json`)
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping week ${week}, file not found: ${filePath}`)
      continue
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    let qCount = 0

    for (const chunk of data) {
      const instruction = chunk.instruction || "Practice"
      const type = chunk.type || "multiple-choice"

      for (const item of chunk.items || []) {
        const questionText = item.questionText || item.sentence || "No question text"
        
        // Handle options which can be flat or array of arrays
        let optionsToCreate = []
        if (item.options && item.options.length > 0) {
          if (Array.isArray(item.options[0])) {
            // paragraph-cloze: array of arrays
            item.options.forEach((optGroup, idx) => {
              optGroup.forEach(opt => {
                optionsToCreate.push({
                  text: String(opt.text),
                  isCorrect: Boolean(opt.isCorrect),
                  blankIndex: opt.blankIndex || (idx + 1)
                })
              })
            })
          } else {
            // standard multiple choice: flat array
            item.options.forEach(opt => {
              optionsToCreate.push({
                text: String(opt.text),
                isCorrect: Boolean(opt.isCorrect),
                blankIndex: opt.blankIndex || 1
              })
            })
          }
        }

        // Find correct answer from options (only useful for flat multiple choice)
        let correctAnswer = item.correctAnswer || item.answer || null
        if (!Array.isArray(item.options?.[0])) {
            const correctOpt = item.options?.find(o => o.isCorrect)
            if (correctOpt) correctAnswer = String(correctOpt.text)
        }

        const createdQuestion = await prisma.practiceQuestion.create({
          data: {
            listId: listId,
            week: week,
            questionText: questionText,
            instruction: instruction,
            type: type,
            correctAnswer: correctAnswer,
            options: {
              create: optionsToCreate
            }
          }
        })
        qCount++
      }
    }
    console.log(`Seeded week ${week} with ${qCount} questions`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

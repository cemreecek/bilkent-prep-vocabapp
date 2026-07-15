import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const dataDir = path.join(__dirname, '../public/data/practices')
  
  const filesToProcess: { file: string, level: string, week: number }[] = [
    // All sets have been seeded. Array intentionally left empty to prevent accidental overwrites of manual edits.
  ]

  for (const { file, level, week } of filesToProcess) {
    const filePath = path.join(dataDir, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`)
      continue
    }

    console.log(`Processing ${level} Set ${week}...`)

    // Find the VocabList for this level and week
    let vocabList = await prisma.vocabList.findFirst({
      where: { level, unit: String(week) }
    })

    if (!vocabList) {
      console.log(`No VocabList found for ${level} Week ${week}, creating one...`)
      vocabList = await prisma.vocabList.create({
        data: {
          level,
          unit: String(week)
        }
      })
    }

    // Delete existing questions for this week
    await prisma.practiceQuestion.deleteMany({
      where: {
        listId: vocabList.id
      }
    })

    // Read JSON
    const content = fs.readFileSync(filePath, 'utf8')
    let sections: any[] = []
    try {
      sections = JSON.parse(content)
    } catch(e) {
      console.error(`Failed to parse ${file}`, e)
      continue
    }

    // Insert new questions
    for (const section of sections) {
      const instruction = section.instruction || 'Follow instructions'
      const type = section.type || 'multiple-choice'

      let itemsToProcess = Array.isArray(section.items) ? section.items : [];
      if (itemsToProcess.length === 0 && section.questionText) {
         itemsToProcess = [section];
      }

      for (const item of itemsToProcess) {
        const q = await prisma.practiceQuestion.create({
          data: {
            listId: vocabList.id,
            week,
            questionText: item.questionText || '',
            instruction: item.instruction || instruction,
            type: item.type || type,
            correctAnswer: item.correctAnswer || null
          }
        })

        if (item.options && Array.isArray(item.options)) {
          let flatOptions: any[] = []
          if (item.options.length > 0 && Array.isArray(item.options[0])) {
             flatOptions = item.options.flat()
          } else {
             flatOptions = item.options
          }

          if (flatOptions.length > 0) {
            await prisma.practiceOption.createMany({
              data: flatOptions.map((o: any) => ({
                questionId: q.id,
                text: String(o.text || ''),
                isCorrect: !!o.isCorrect,
                blankIndex: Number(o.blankIndex) || 1
              }))
            })
          }
        }
      }
    }
    console.log(`✅ Integrated ${level} Set ${week} successfully.`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

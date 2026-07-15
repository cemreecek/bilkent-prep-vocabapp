import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const dataDir = path.join(__dirname, '../app/public/data/practices')
  
  const filesToProcess = [
    { file: 'prefac-practice-set-2.json', level: 'PreFac', week: 2 },
    { file: 'prefac-practice-set-3.json', level: 'PreFac', week: 3 },
    { file: 'prefac-practice-set-4.json', level: 'PreFac', week: 4 },
    { file: 'prefac-practice-set-5.json', level: 'PreFac', week: 5 },
    { file: 'prefac-practice-set-6.json', level: 'PreFac', week: 6 },
    { file: 'prefac-practice-set-7.json', level: 'PreFac', week: 7 },
    { file: 'prefac-practice-set-8.json', level: 'PreFac', week: 8 },
    { file: 'upper-set-1.json', level: 'UpperIntermediate', week: 1 },
    { file: 'upper-set-2.json', level: 'UpperIntermediate', week: 2 },
    { file: 'upper-set-3.json', level: 'UpperIntermediate', week: 3 },
    { file: 'upper-set-4.json', level: 'UpperIntermediate', week: 4 },
    { file: 'upper-set-5.json', level: 'UpperIntermediate', week: 5 },
    { file: 'upper-set-6.json', level: 'UpperIntermediate', week: 6 },
    { file: 'upper-set-7.json', level: 'UpperIntermediate', week: 7 },
    { file: 'upper-set-8.json', level: 'UpperIntermediate', week: 8 }
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
      where: { level, week }
    })

    if (!vocabList) {
      console.log(`No VocabList found for ${level} Week ${week}, creating one...`)
      vocabList = await prisma.vocabList.create({
        data: {
          title: `${level} Set ${week}`,
          level,
          week
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

      if (Array.isArray(section.items)) {
        for (const item of section.items) {
          const q = await prisma.practiceQuestion.create({
            data: {
              listId: vocabList.id,
              questionText: item.questionText || '',
              instruction,
              type,
              correctAnswer: item.correctAnswer || null
            }
          })

          if (item.options && Array.isArray(item.options)) {
            // Check if options is an array of arrays (e.g., paragraph cloze) or flat array
            let flatOptions: any[] = []
            if (item.options.length > 0 && Array.isArray(item.options[0])) {
               // Array of arrays
               flatOptions = item.options.flat()
            } else {
               flatOptions = item.options
            }

            if (flatOptions.length > 0) {
              await prisma.practiceOption.createMany({
                data: flatOptions.map((o: any) => ({
                  questionId: q.id,
                  text: o.text || '',
                  isCorrect: !!o.isCorrect,
                  blankIndex: o.blankIndex || 1
                }))
              })
            }
          }
        }
      }
    }
    console.log(`✅ Integrated ${level} Set ${week} successfully.`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

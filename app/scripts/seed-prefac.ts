import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Pre-Fac Seeder...')
  
  // 1. Ensure VocabList exists
  let list = await prisma.vocabList.findFirst({
    where: { level: 'PreFac', unit: 'Fall Semester' }
  })
  
  if (!list) {
    list = await prisma.vocabList.create({
      data: { level: 'PreFac', unit: 'Fall Semester' }
    })
    console.log('Created new VocabList for PreFac Fall Semester.')
  } else {
    console.log('Found existing VocabList for PreFac Fall Semester.')
  }

  // 2. Seed Flashcards
  const flashcardDataPath = path.join(process.cwd(), 'public', 'data', 'flashcards')
  const flashcardFiles = fs.readdirSync(flashcardDataPath).filter(f => f.startsWith('prefac-set-') && f.endsWith('.json'))

  for (const file of flashcardFiles) {
    const setNum = parseInt(file.match(/set-(\d+)/)?.[1] || '1')
    console.log(`\nProcessing Flashcards Set ${setNum}...`)
    
    const filePath = path.join(flashcardDataPath, file)
    const flashcards = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    let count = 0;
    for (const card of flashcards) {
      const existingWord = await prisma.vocabWord.findFirst({
        where: { 
          listId: list.id, 
          word: { equals: card.word, mode: 'insensitive' } 
        }
      })

      if (existingWord) {
        await prisma.vocabWord.update({
          where: { id: existingWord.id },
          data: {
            definition: card.definition,
            example: card.example,
            day: card.day,
            week: setNum
          }
        })
      } else {
        await prisma.vocabWord.create({
          data: {
            listId: list.id,
            word: card.word,
            definition: card.definition,
            example: card.example,
            day: card.day,
            week: setNum
          }
        })
      }
      count++
    }
    console.log(`✅ Seeded/Updated ${count} flashcards for Set ${setNum}.`)
  }

  // 3. Seed Practice Questions
  const practiceDataPath = path.join(process.cwd(), 'public', 'data', 'practices')
  const practiceFiles = fs.readdirSync(practiceDataPath).filter(f => f.startsWith('prefac-practice-set-') && f.endsWith('.json'))

  for (const file of practiceFiles) {
    const setNum = parseInt(file.match(/set-(\d+)/)?.[1] || '1')
    console.log(`\nProcessing Practices Set ${setNum}...`)
    
    // Clear old practice questions for this week
    await prisma.practiceQuestion.deleteMany({
      where: { listId: list.id, week: setNum }
    })
    
    const filePath = path.join(practiceDataPath, file)
    const practices = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    let count = 0;
    for (const q of practices) {
      if (q.type === 'gap-fill') {
        await prisma.practiceQuestion.create({
          data: {
            listId: list.id,
            week: setNum,
            type: q.type,
            instruction: q.instruction,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer
          }
        })
      } else {
        await prisma.practiceQuestion.create({
          data: {
            listId: list.id,
            week: setNum,
            type: q.type,
            instruction: q.instruction,
            questionText: q.questionText,
            options: { create: q.options }
          }
        })
      }
      count++
    }
    console.log(`✅ Seeded ${count} practice questions for Set ${setNum}.`)
  }

  console.log('\nAll done seeding Pre-Fac!')
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})

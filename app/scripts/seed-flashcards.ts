import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Flashcard Seeder...')
  const dataPath = path.join(process.cwd(), 'public', 'data', 'flashcards')
  
  if (!fs.existsSync(dataPath)) {
    console.error('No flashcard JSON data found in public/data/flashcards.')
    return
  }

  const files = fs.readdirSync(dataPath).filter(f => f.startsWith('upper-set-') && f.endsWith('.json'))

  const list = await prisma.vocabList.findFirst({
    where: { level: 'UpperIntermediate', unit: 'Periods 1-3' }
  })
  
  if (!list) {
    console.error('Could not find VocabList for Upper - Periods 1-3. Run main seeder first.')
    return
  }

  for (const file of files) {
    const setNum = parseInt(file.match(/set-(\d+)/)?.[1] || '1')
    console.log(`\nProcessing Set ${setNum}...`)
    
    const filePath = path.join(dataPath, file)
    const flashcards = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    let count = 0;
    for (const card of flashcards) {
      // Find if the word already exists for this list
      const existingWord = await prisma.vocabWord.findFirst({
        where: { 
          listId: list.id, 
          word: { equals: card.word, mode: 'insensitive' } 
        }
      })

      if (existingWord) {
        // Update existing word with simple definition, day, and example
        await prisma.vocabWord.update({
          where: { id: existingWord.id },
          data: {
            definition: card.definition,
            example: card.example,
            day: card.day,
            week: setNum // Just in case it was wrong
          }
        })
      } else {
        // Create new word if it doesn't exist
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
    
    console.log(`✅ Success! Seeded/Updated ${count} flashcards for Set ${setNum}.`)
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})

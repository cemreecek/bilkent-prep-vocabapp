const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log("Looking up VocabList...")
  const list = await prisma.vocabList.findFirst({
    where: { level: "UpperIntermediate", unit: "Spring Semester" }
  })

  if (!list) {
    console.error("VocabList for UpperIntermediate Spring Semester not found! Make sure you seeded the list first.")
    process.exit(1)
  }

  const flashcardsDir = path.join(__dirname, '..', 'public', 'data', 'flashcards')
  const files = fs.readdirSync(flashcardsDir).filter(f => f.startsWith('upper-set-') && f.endsWith('.json'))

  let totalWords = 0

  // Clear existing words for this list to avoid duplicates
  console.log("Clearing existing VocabWords for this list...")
  await prisma.vocabWord.deleteMany({
    where: { listId: list.id }
  })

  for (const file of files) {
    const weekMatch = file.match(/upper-set-(\d+)\.json/)
    if (!weekMatch) continue
    const week = parseInt(weekMatch[1], 10)

    const filePath = path.join(flashcardsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    let wordsData = []
    try {
      wordsData = JSON.parse(content)
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message)
      continue
    }

    if (!Array.isArray(wordsData) || wordsData.length === 0) {
      continue
    }

    let weekCount = 0
    for (const item of wordsData) {
      if (!item.word || !item.definition) continue
      
      await prisma.vocabWord.create({
        data: {
          listId: list.id,
          week: week,
          word: item.word,
          definition: item.definition,
          day: parseInt(item.day, 10) || 1,
          example: item.example || null
        }
      })
      weekCount++
      totalWords++
    }
    console.log(`Seeded week ${week} with ${weekCount} flashcards`)
  }

  console.log(`Successfully seeded ${totalWords} flashcards total!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

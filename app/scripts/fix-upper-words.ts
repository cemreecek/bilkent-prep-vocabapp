import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const list = await prisma.vocabList.findFirst({
    where: { level: 'UpperIntermediate', unit: 'Periods 1-3' }
  })
  
  if (list) {
    console.log('Deleting all words in Upper Intermediate list to clean up erroneous Pre-Fac words...')
    await prisma.vocabWord.deleteMany({
      where: { listId: list.id }
    })
    console.log('Words deleted. You can now safely re-run seed-flashcards.ts.')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

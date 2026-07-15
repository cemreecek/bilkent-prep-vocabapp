import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const lists = await prisma.vocabList.findMany()
  console.log('Lists:', lists)

  const words = await prisma.vocabWord.findMany({
    where: { week: 1, day: 1 }
  })
  console.log('Words for week 1, day 1:', words.length)
  if (words.length > 0) {
    console.log(words[0])
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())

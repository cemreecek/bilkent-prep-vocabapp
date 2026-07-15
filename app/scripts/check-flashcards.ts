import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const words = await prisma.vocabWord.findMany({
    where: { week: 1 }
  })
  console.log('Words found for week 1:', words.length)
  if (words.length > 0) {
    console.log(words[0])
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())

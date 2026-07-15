import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const words = await prisma.vocabWord.findMany({
    where: { listId: 'cmpwqhfid0000yiiqlpd2omif', week: 1, day: 1 }
  })
  console.log('Words in Periods 1-3 for week 1, day 1:', words.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())

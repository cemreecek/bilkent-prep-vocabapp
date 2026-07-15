import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const words = await prisma.vocabWord.findMany({
    where: { listId: 'cmpxzulz20000371mkl1e6bmk' },
    select: { week: true, day: true }
  })
  console.log(`Words in Periods 1-3 list: ${words.length}`)
  if (words.length > 0) {
    console.log('Sample word week/day:', words[0])
  }
}

main().finally(() => prisma.$disconnect())

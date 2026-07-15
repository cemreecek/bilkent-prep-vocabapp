import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const types = await prisma.practiceQuestion.groupBy({
    by: ['type'],
    _count: true
  })
  console.log(types)
}

main().finally(() => prisma.$disconnect())

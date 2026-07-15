import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const weeks = await prisma.practiceQuestion.findMany({
    where: { list: { level: 'Upper' } },
    select: { week: true },
    distinct: ['week']
  })
  console.log('Available weeks:', weeks)
}

main().catch(console.error).finally(() => prisma.$disconnect())

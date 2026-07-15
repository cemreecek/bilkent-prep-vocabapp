const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const level = 'UpperIntermediate'
  const availableWeeks = await prisma.practiceQuestion.findMany({
    where: { list: { level: level } },
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'asc' }
  })
  console.log("availableWeeks:", availableWeeks)
}
main().finally(() => prisma.$disconnect())

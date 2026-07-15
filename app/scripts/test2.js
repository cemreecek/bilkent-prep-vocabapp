const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const availableWeeks = await prisma.practiceQuestion.findMany({
    where: { list: { level: "UpperIntermediate" } },
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'asc' }
  })
  console.log("availableWeeks from exactly Next.js query:", availableWeeks)
}
main().finally(() => prisma.$disconnect())

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const lists = await prisma.vocabList.findUnique({ where: { id: "upper-intermediate-list" } })
  console.log("VocabList:", lists)

  const count = await prisma.practiceQuestion.count({
    where: { listId: "upper-intermediate-list" }
  })
  console.log("Practice Questions count for upper-intermediate-list:", count)
}

main().finally(() => prisma.$disconnect())

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: "student1@ug.bilkent.edu.tr" },
    data: {
      level: "UpperIntermediate"
    }
  })
  console.log("Updated student1 level to UpperIntermediate")
}

main().catch(console.error).finally(() => prisma.$disconnect())

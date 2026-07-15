import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const sessions = await prisma.session.count()
  const streaks = await prisma.streak.count()
  const errors = await prisma.errorLog.count()
  console.log(`Sessions: ${sessions}, Streaks: ${streaks}, Errors: ${errors}`)
}

main().finally(() => prisma.$disconnect())

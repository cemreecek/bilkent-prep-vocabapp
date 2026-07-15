const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Fixing DB Enum...")
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "Level" ADD VALUE IF NOT EXISTS 'PreIntermediate';`)
    await prisma.$executeRawUnsafe(`ALTER TYPE "Level" ADD VALUE IF NOT EXISTS 'UpperIntermediate';`)
    await prisma.$executeRawUnsafe(`ALTER TYPE "Level" ADD VALUE IF NOT EXISTS 'PreFac';`)
    console.log("Successfully altered enum")
  } catch (e) {
    console.error("Failed to alter enum:", e)
  }
}

main().finally(() => prisma.$disconnect())

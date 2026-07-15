import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const words = await prisma.vocabWord.findMany({
    where: { word: 'Implement' }
  })
  console.log('Words found:', words)
}
main().catch(console.error).finally(() => prisma.$disconnect())

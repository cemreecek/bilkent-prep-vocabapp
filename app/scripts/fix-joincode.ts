import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const classrooms = await prisma.classroom.findMany();
  for (const c of classrooms) {
    if (!c.joinCode) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await prisma.classroom.update({
        where: { id: c.id },
        data: { joinCode: newCode }
      });
      console.log(`Updated classroom ${c.name} with joinCode: ${newCode}`);
    } else {
      console.log(`Classroom ${c.name} already has joinCode: ${c.joinCode}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

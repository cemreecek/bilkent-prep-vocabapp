import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { email: 'student1@ug.bilkent.edu.tr' },
    data: { classroomId: null }
  });
  console.log('Cleared classroomId for student1');
}
main().finally(() => prisma.$disconnect());

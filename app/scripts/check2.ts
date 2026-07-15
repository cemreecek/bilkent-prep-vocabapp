import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', users.map(u => ({ email: u.email, classroomId: u.classroomId })));
}
main().finally(() => prisma.$disconnect());

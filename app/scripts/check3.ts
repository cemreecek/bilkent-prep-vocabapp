import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('ALL USERS:', users.map(u => ({ id: u.id, email: u.email, name: u.name, classroomId: u.classroomId })));
}
main().finally(() => prisma.$disconnect());

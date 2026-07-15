import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', users.map(u => ({ email: u.email, role: u.role, password: !!u.password })));
}
main().finally(() => prisma.$disconnect());

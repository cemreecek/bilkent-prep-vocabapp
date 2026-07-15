import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@bilkent.edu.tr' },
    update: {},
    create: {
      email: 'admin@bilkent.edu.tr',
      name: 'Admin User',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher1@bilkent.edu.tr' },
    update: {},
    create: {
      email: 'teacher1@bilkent.edu.tr',
      name: 'Prof. Selim',
      password: await bcrypt.hash('Teacher@123', 10),
      role: 'TEACHER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student1@ug.bilkent.edu.tr' },
    update: {},
    create: {
      email: 'student1@ug.bilkent.edu.tr',
      name: 'Ayşe Yılmaz',
      password: await bcrypt.hash('Student@123', 10),
      role: 'STUDENT',
    },
  });

  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher1@bilkent.edu.tr' },
  });

  if (teacher) {
    const existingClass = await prisma.classroom.findFirst({
      where: { name: 'Upper-Intermediate - Section A' }
    });
    
    if (!existingClass) {
      await prisma.classroom.create({
        data: {
          name: 'Upper-Intermediate - Section A',
          teacherId: teacher.id,
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      });
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

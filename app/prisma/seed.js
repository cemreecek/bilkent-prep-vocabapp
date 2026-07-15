const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10)
  const teacherPassword = await bcrypt.hash("Teacher@123", 10)
  const studentPassword = await bcrypt.hash("Student@123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@bilkent.edu.tr" },
    update: { name: "Platform Admin", role: "ADMIN" },
    create: {
      email: "admin@bilkent.edu.tr",
      password: adminPassword,
      name: "Platform Admin",
      role: "ADMIN"
    }
  })

  const teacher = await prisma.user.upsert({
    where: { email: "teacher1@bilkent.edu.tr" },
    update: { name: "English Teacher", role: "TEACHER" },
    create: {
      email: "teacher1@bilkent.edu.tr",
      password: teacherPassword,
      name: "English Teacher",
      role: "TEACHER"
    }
  })

  let classroom = await prisma.classroom.findFirst({ where: { teacherId: teacher.id } })
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        name: "Class A",
        teacherId: teacher.id
      }
    })
  }

  await prisma.user.upsert({
    where: { email: "student1@ug.bilkent.edu.tr" },
    update: {
      name: "Student One",
      role: "STUDENT",
      classroomId: classroom.id
    },
    create: {
      email: "student1@ug.bilkent.edu.tr",
      password: studentPassword,
      name: "Student One",
      role: "STUDENT",
      classroomId: classroom.id
    }
  })

  await prisma.vocabList.upsert({
    where: { id: "sample-list-1" },
    update: {},
    create: {
      id: "sample-list-1",
      level: "Elementary",
      unit: "Unit 1",
      words: {
        create: [
          { word: "Ambiguous", definition: "Open to more than one interpretation" },
          { word: "Compound", definition: "Made up of two or more parts" },
          { word: "Evaluate", definition: "To judge or determine the significance" }
        ]
      }
    }
  })

  console.log("Seed data created: admin, teacher, student, classroom, sample vocab list")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

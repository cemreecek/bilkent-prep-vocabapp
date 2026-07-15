import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding mock student activity for the Teacher Dashboard...')

  const student = await prisma.user.findUnique({
    where: { email: 'student1@ug.bilkent.edu.tr' }
  })

  if (!student) {
    console.log('Student not found.')
    return
  }

  // Create a 5-day streak
  await prisma.streak.upsert({
    where: { userId: student.id },
    update: { currentStreak: 5, totalPoints: 1250, lastLogin: new Date() },
    create: {
      userId: student.id,
      currentStreak: 5,
      totalPoints: 1250,
      lastLogin: new Date()
    }
  })

  // Create some past sessions
  const sessionTypes = ['practice', 'flashcards', 'review']
  for (let i = 0; i < 15; i++) {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 7))
    pastDate.setHours(pastDate.getHours() - Math.floor(Math.random() * 24))
    
    await prisma.session.create({
      data: {
        userId: student.id,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + (Math.random() * 15 + 5) * 60000), // 5-20 mins later
        duration: Math.floor(Math.random() * 15 + 5) * 60,
        type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        createdAt: pastDate
      }
    })
  }

  // Create some errors to populate the "Common Errors" chart
  // Fetch some words to use for errors
  const words = await prisma.vocabWord.findMany({ take: 5 })
  
  const recentSession = await prisma.session.findFirst({
    where: { userId: student.id }
  })

  if (recentSession && words.length > 0) {
    for (let i = 0; i < 8; i++) {
      await prisma.errorLog.create({
        data: {
          userId: student.id,
          sessionId: recentSession.id,
          wordId: words[Math.floor(Math.random() * words.length)].id,
          timestamp: new Date()
        }
      })
    }
  }

  console.log('✅ Mock activity successfully seeded!')
}

main().finally(() => prisma.$disconnect())

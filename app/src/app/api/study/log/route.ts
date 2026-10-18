import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { nextStreak, dayIndex } from '@/lib/streak'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { type, score, maxScore } = body

    // 1. Log the session
    await prisma.session.create({
      data: {
        userId: user.id,
        startTime: new Date(),
        type: type, // e.g. "flashcard_W1_D1" or "practice_W1"
      }
    })

    // 2. Update Streak
    let streak = await prisma.streak.findUnique({
      where: { userId: user.id }
    })

    if (!streak) {
      streak = await prisma.streak.create({
        data: { userId: user.id, currentStreak: 0, totalPoints: 0 }
      })
    }

    const now = new Date()
    const newStreak = nextStreak(streak, now)
    const isNewDay = !streak.lastLogin || dayIndex(now) > dayIndex(streak.lastLogin)
    let pointsToAdd = 0

    // Gamification Rules
    if (type.startsWith('flashcard_')) {
      pointsToAdd = 10 // Daily flashcard study points
    } else if (type.startsWith('practice_')) {
      pointsToAdd = 20 // Base points for completing practice
      if (score !== undefined && maxScore !== undefined && score / maxScore >= 0.8) {
        pointsToAdd += 30
      }
      pointsToAdd += 10
    }

    // Bonus points for maintaining streak (once per day)
    if (isNewDay) {
      if (newStreak > 3) pointsToAdd += 5
      if (newStreak > 7) pointsToAdd += 10
    }

    await prisma.streak.update({
      where: { userId: user.id },
      data: {
        currentStreak: newStreak,
        lastLogin: now,
        totalPoints: streak.totalPoints + pointsToAdd
      }
    })

    return NextResponse.json({ success: true, pointsAdded: pointsToAdd, currentStreak: newStreak })
  } catch (error) {
    console.error('Error logging study session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let lastLoginDate = streak.lastLogin ? new Date(streak.lastLogin) : null
    if (lastLoginDate) lastLoginDate.setHours(0, 0, 0, 0)

    let newStreak = streak.currentStreak
    let pointsToAdd = 0

    // Gamification Rules
    if (type.startsWith('flashcard_')) {
      pointsToAdd = 10 // Daily flashcard study points
    } else if (type.startsWith('practice_')) {
      pointsToAdd = 20 // Base points for completing practice
      
      // Bonus: if score > 80%
      if (score !== undefined && maxScore !== undefined) {
        if (score / maxScore >= 0.8) {
          pointsToAdd += 30
        }
      }

      // Check if they studied all flashcards this week?
      // For now, give a flat bonus for completing practice.
      pointsToAdd += 10
    }

    if (!lastLoginDate || lastLoginDate.getTime() < today.getTime()) {
      // It's a new day
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (lastLoginDate && lastLoginDate.getTime() === yesterday.getTime()) {
        newStreak += 1
      } else {
        newStreak = 1 // reset
      }
      
      // Bonus points for maintaining streak
      if (newStreak > 3) pointsToAdd += 5
      if (newStreak > 7) pointsToAdd += 10
    }

    await prisma.streak.update({
      where: { userId: user.id },
      data: {
        currentStreak: newStreak,
        lastLogin: new Date(),
        totalPoints: streak.totalPoints + pointsToAdd
      }
    })

    return NextResponse.json({ success: true, pointsAdded: pointsToAdd, currentStreak: newStreak })
  } catch (error) {
    console.error('Error logging study session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Basic SM-2 algorithm calculation
function calculateSM2(quality: number, previousEase: number, previousInterval: number, repetitions: number) {
  let interval = 1
  let easeFactor = previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  if (easeFactor < 1.3) easeFactor = 1.3

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(previousInterval * easeFactor)
    }
    repetitions++
  }

  return { interval, easeFactor, repetitions }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { wordId, quality, timeSpent } = await request.json()
  
  // quality is 0-5 (0=Again, 3=Hard, 4=Good, 5=Easy)
  const numericQuality = parseInt(quality)

  // Speed penalty logic
  if (timeSpent !== undefined && timeSpent < 2) {
    // Increment error debt by 5 for fast answers
    await prisma.user.update({
      where: { id: user.id },
      data: { errorScore: { increment: 5 } }
    })
  } else if (numericQuality >= 4 && (user.errorScore ?? 0) > 0) {
    // Revise error debt down if answered well
    await prisma.user.update({
      where: { id: user.id },
      data: { errorScore: { decrement: 1 } }
    })
  }

  // Find existing progress
  let progress = await prisma.flashcardProgress.findUnique({
    where: {
      userId_wordId: {
        userId: user.id,
        wordId: wordId
      }
    }
  })

  let newInterval = 1
  let newEase = 2.5
  let newRepetitions = 0

  if (progress) {
    const sm2 = calculateSM2(
      numericQuality, 
      progress.easeFactor, 
      progress.interval, 
      progress.correctCount // using correctCount as repetitions for simplicity
    )
    newInterval = sm2.interval
    newEase = sm2.easeFactor
    newRepetitions = sm2.repetitions
  } else {
    // First time review
    const sm2 = calculateSM2(numericQuality, 2.5, 0, 0)
    newInterval = sm2.interval
    newEase = sm2.easeFactor
    newRepetitions = sm2.repetitions
  }

  // Calculate next review date
  const nextReviewAt = new Date()
  if (numericQuality < 3) {
    // Review again today (add 10 minutes)
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10)
  } else {
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)
  }

  const updatedProgress = await prisma.flashcardProgress.upsert({
    where: {
      userId_wordId: {
        userId: user.id,
        wordId: wordId
      }
    },
    update: {
      totalReviews: { increment: 1 },
      correctCount: newRepetitions,
      easeFactor: newEase,
      interval: newInterval,
      nextReviewAt: nextReviewAt,
      lastReviewAt: new Date()
    },
    create: {
      userId: user.id,
      wordId: wordId,
      totalReviews: 1,
      correctCount: newRepetitions,
      easeFactor: newEase,
      interval: newInterval,
      nextReviewAt: nextReviewAt,
      lastReviewAt: new Date()
    }
  })

  return NextResponse.json(updatedProgress)
}

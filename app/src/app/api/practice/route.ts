import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface PracticeAnswer {
  wordId?: string
  questionId: string
  answer: string
  correct: boolean
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { listId, answers, type = "practice" } = body

  if (type === "practice" && !listId) {
    return NextResponse.json({ error: "listId is required for practice sessions." }, { status: 400 })
  }

  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const correctCount = answers.filter((item: PracticeAnswer) => item.correct).length
  const missedLogs = answers
    .filter((item: PracticeAnswer) => !item.correct)
    .map((item: PracticeAnswer) => ({
      sessionId: "",
      wordId: item.wordId || null,
      questionId: item.questionId,
      userId: user.id,
    }))

  const sessionRecord = await prisma.session.create({
    data: {
      userId: user.id,
      startTime: now,
      endTime: now,
      duration: 0,
      type,
    },
  })

  if (missedLogs.length > 0) {
    await prisma.errorLog.createMany({
      data: missedLogs.map((log) => ({
        ...log,
        sessionId: sessionRecord.id,
      })),
      skipDuplicates: true,
    })
  }

  let totalPoints = correctCount * 10
  let resetStreak = missedLogs.length > 2 // Allow up to 2 misses
  let errorIncrement = missedLogs.length * 5

  // Speed penalty calculation
  let speedViolations = 0
  answers.forEach((item: any) => {
    if (item.timeSpent !== undefined && item.timeSpent < 2) {
      speedViolations++
    }
  })

  if (speedViolations > 0) {
    // Add a normal error debt amount (e.g. 5) for every unnaturally fast answer
    errorIncrement += (speedViolations * 5)
  }

  if (type === "review") {
    // For review, award bonus points and don't reset streak
    totalPoints = correctCount * 15 // bonus
    resetStreak = false
    errorIncrement = (missedLogs.length * 5) + (speedViolations * 5) // ensure misses add to debt!
  }

  await prisma.streak.upsert({
    where: {
      userId: user.id,
    },
    update: {
      currentStreak: resetStreak ? 0 : { increment: 1 },
      totalPoints: {
        increment: totalPoints,
      },
      lastLogin: now,
    },
    create: {
      userId: user.id,
      currentStreak: resetStreak ? 0 : 1,
      totalPoints,
      lastLogin: now,
    },
  })

  let newErrorScore = user.errorScore + errorIncrement;
  if (type === "review") {
    newErrorScore = user.errorScore + errorIncrement - (correctCount * 5);
  }
  newErrorScore = Math.max(0, newErrorScore);

  if (newErrorScore !== user.errorScore) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        errorScore: newErrorScore,
      },
    })
  }

  // Clear error logs for correct answers so they don't get stuck in a review loop
  const correctAnswers = answers.filter((item: PracticeAnswer) => item.correct)
  if (correctAnswers.length > 0) {
    const correctQuestionIds = correctAnswers.map((item: PracticeAnswer) => item.questionId).filter(Boolean) as string[]
    const correctWordIds = correctAnswers.map((item: PracticeAnswer) => item.wordId).filter(Boolean) as string[]
    
    if (correctQuestionIds.length > 0) {
      await prisma.errorLog.deleteMany({
        where: {
          userId: user.id,
          questionId: { in: correctQuestionIds }
        }
      })
    }
    
    if (correctWordIds.length > 0) {
      await prisma.errorLog.deleteMany({
        where: {
          userId: user.id,
          wordId: { in: correctWordIds }
        }
      })
    }
  }

  return NextResponse.json({
    sessionId: sessionRecord.id,
    correctCount,
    total: answers.length,
    missedCount: missedLogs.length,
    pointsEarned: totalPoints,
  })
}

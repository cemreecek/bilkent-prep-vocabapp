import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nextStreak } from "@/lib/streak"

const ERROR_POINTS = 5
/** A correct answer given faster than this (seconds) is treated as a non-human/guess penalty. */
const MIN_HUMAN_SECONDS = 5
const MAX_ANSWERS = 500

interface PracticeAnswer {
  wordId?: string | null
  questionId?: string | null
  answer?: string
  correct: boolean
  timeSpent?: number
}

const asId = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null

/** Normalise and de-duplicate the payload. One entry per question (or word). Last write wins. */
function normaliseAnswers(raw: unknown[]): PracticeAnswer[] {
  const byKey = new Map<string, PracticeAnswer>()
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const a = item as Record<string, unknown>
    const questionId = asId(a.questionId)
    const wordId = asId(a.wordId)
    const key = questionId ?? (wordId ? `w:${wordId}` : null)
    if (!key) continue // nothing to attribute the answer to -> ignore
    byKey.set(key, {
      questionId,
      wordId,
      correct: a.correct === true, // strict: "false"/0/undefined are NOT correct
      timeSpent: typeof a.timeSpent === "number" ? a.timeSpent : undefined,
    })
  }
  return [...byKey.values()]
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const { listId, answers: rawAnswers, type = "practice" } = body ?? {}

  if (type === "practice" && !listId) {
    return NextResponse.json({ error: "listId is required for practice sessions." }, { status: 400 })
  }
  if (!Array.isArray(rawAnswers) || rawAnswers.length > MAX_ANSWERS) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const answers = normaliseAnswers(rawAnswers)
  if (answers.length === 0) {
    return NextResponse.json({ error: "No valid answers submitted." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const isTooFast = (a: PracticeAnswer) => a.timeSpent !== undefined && a.timeSpent < MIN_HUMAN_SECONDS

  // Sum real time spent across all answered items (capped at 10m per question against idle tabs)
  const sessionDuration = answers.reduce(
    (sum, a) => sum + Math.max(0, Math.min(600, Math.round(a.timeSpent || 0))),
    0
  )

  // Correct AND human-paced -> earns points and clears the error log.
  const clean = answers.filter((a) => a.correct && !isTooFast(a))
  // Wrong answers, plus correct answers given in under 5 seconds, stay/enter the error log.
  const penalised = answers.filter((a) => !a.correct || isTooFast(a))
  const missedCount = answers.filter((a) => !a.correct).length
  const tooFastCount = answers.filter((a) => a.correct && isTooFast(a)).length

  const result = await prisma.$transaction(async (tx) => {
    const freshUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })

    const sessionRecord = await tx.session.create({
      data: {
        userId: user.id,
        startTime: new Date(now.getTime() - sessionDuration * 1000),
        endTime: now,
        duration: sessionDuration,
        type,
      },
    })

    // Match error logs by question when we have one, by word only as a fallback.
    const logWhere = (a: PracticeAnswer) =>
      a.questionId
        ? { userId: user.id, questionId: a.questionId }
        : { userId: user.id, questionId: null, wordId: a.wordId! }

    // 1) Clean correct answers clear the matching open error logs (and ONLY those).
    for (const a of clean) {
      await tx.errorLog.deleteMany({ where: logWhere(a) })
    }

    // 2) Mistakes and too-fast answers keep a single open log per question.
    for (const a of penalised) {
      const exists = await tx.errorLog.findFirst({ where: logWhere(a), select: { id: true } })
      if (exists) continue
      await tx.errorLog.create({
        data: {
          sessionId: sessionRecord.id,
          userId: user.id,
          questionId: a.questionId ?? null,
          wordId: a.wordId ?? null,
        },
      })
    }

    // 3) Error points strictly match the user's open unresolved ErrorLog count (* 5).
    const openLogs = await tx.errorLog.count({ where: { userId: user.id } })
    const errorScore = openLogs * ERROR_POINTS

    if (errorScore !== freshUser.errorScore) {
      await tx.user.update({ where: { id: user.id }, data: { errorScore } })
    }

    // 4) Points + calendar-day streak (Turkey time).
    const totalPoints = clean.length * (type === "review" ? 15 : 10)
    const streak = await tx.streak.findUnique({ where: { userId: user.id } })
    const currentStreak = nextStreak(streak, now)

    await tx.streak.upsert({
      where: { userId: user.id },
      update: { currentStreak, totalPoints: { increment: totalPoints }, lastLogin: now },
      create: { userId: user.id, currentStreak, totalPoints, lastLogin: now },
    })

    return { sessionId: sessionRecord.id, totalPoints, errorScore, currentStreak }
  })

  return NextResponse.json({
    sessionId: result.sessionId,
    correctCount: answers.filter((a) => a.correct).length,
    total: answers.length,
    missedCount,
    tooFastCount,
    pointsEarned: result.totalPoints,
    errorScore: result.errorScore,
    currentStreak: result.currentStreak,
  })
}

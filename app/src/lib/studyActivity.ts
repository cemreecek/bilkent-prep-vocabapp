import { prisma } from "@/lib/prisma"
import { dayIndex, nextStreak } from "@/lib/streak"

/**
 * Marks "today" as a study day for a user (flashcards, study logger, etc.)
 * and keeps the streak in sync. Safe to call many times a day: it only writes
 * one Session per activity type per day and never double-counts the streak.
 */
export async function recordStudyActivity(userId: string, type: string = "flashcard") {
  const now = new Date()
  const today = dayIndex(now)

  const recent = await prisma.session.findFirst({
    where: { userId, type, startTime: { gte: new Date(now.getTime() - 2 * 86_400_000) } },
    orderBy: { startTime: "desc" },
    select: { startTime: true },
  })

  if (!recent || dayIndex(recent.startTime) !== today) {
    await prisma.session.create({
      data: { userId, startTime: now, endTime: now, duration: 0, type },
    })
  }

  const streak = await prisma.streak.findUnique({ where: { userId } })
  const currentStreak = nextStreak(streak, now)
  if (!streak) {
    await prisma.streak.create({ data: { userId, currentStreak, totalPoints: 0, lastLogin: now } })
  } else if (!streak.lastLogin || dayIndex(streak.lastLogin) !== today) {
    await prisma.streak.update({ where: { userId }, data: { currentStreak, lastLogin: now } })
  }
}

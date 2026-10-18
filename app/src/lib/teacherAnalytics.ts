import { prisma } from "@/lib/prisma"
import { dayIndex, effectiveStreak, streakFromStudyDays, studyDaySet, studyWeek } from "@/lib/streak"

export interface TopErrorItem {
  word: string
  count: number
  studentCount: number
  category?: string
}

export interface ActionItem {
  id: string
  tone: "error" | "warning" | "success" | "info"
  icon: string
  title: string
  detail: string
}

export interface ClassroomAnalyticsData {
  topErrors: TopErrorItem[]
  actionItems: ActionItem[]
  updatedAt: string
}

function summarizeQuestionConcept(q: {
  type: string
  questionText: string
  correctAnswer: string | null
  options: { text: string; isCorrect: boolean }[]
}): { label: string; category: string } {
  const category = q.type || "practice"
  if (q.correctAnswer && q.correctAnswer.trim()) {
    const first = q.correctAnswer.split(/[|;]/)[0].trim()
    if (first.length <= 40) return { label: first, category }
  }
  const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.text.trim()).filter(Boolean)
  if (correctOpts.length > 0) {
    const first = correctOpts[0].split("|||")[0].trim()
    if (first.length <= 40) return { label: first, category }
  }
  const cleaned = q.questionText.replace(/\*\*|__+|\{\d+\}|\(\d+\)/g, " ").replace(/\s+/g, " ").trim()
  const snippet = cleaned.length > 36 ? cleaned.slice(0, 36).trim() + "…" : cleaned
  return { label: snippet || `${category} question`, category }
}

export async function getClassroomAnalytics(classroomId: string): Promise<ClassroomAnalyticsData> {
  if (!classroomId || classroomId === "none") {
    return {
      topErrors: [],
      actionItems: [
        {
          id: "no-class",
          tone: "info",
          icon: "info",
          title: "No classroom selected",
          detail: "Select or create a classroom to view live error analytics and action items.",
        },
      ],
      updatedAt: new Date().toISOString(),
    }
  }

  const [students, errorLogs] = await Promise.all([
    prisma.user.findMany({
      where: { classroomId },
      include: {
        streaks: true,
        sessions: {
          where: { startTime: { gte: new Date(Date.now() - 14 * 86_400_000) } },
          select: { startTime: true },
        },
        journalEntries: {
          where: { createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } },
          select: { createdAt: true },
        },
        flashcardProgress: {
          where: { lastReviewAt: { gte: new Date(Date.now() - 14 * 86_400_000) } },
          select: { lastReviewAt: true },
        },
      },
    }),
    prisma.errorLog.findMany({
      where: { user: { classroomId } },
      include: {
        word: { select: { id: true, word: true } },
        question: {
          select: {
            id: true,
            type: true,
            questionText: true,
            correctAnswer: true,
            options: { select: { text: true, isCorrect: true } },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
  ])

  // Aggregate unique open errors per student + question/word
  const seenPerStudent = new Set<string>()
  const buckets = new Map<string, { word: string; count: number; users: Set<string>; category?: string }>()
  const typeCounts = new Map<string, number>()

  for (const log of errorLogs) {
    const dedupKey = `${log.userId}:${log.questionId ? `q:${log.questionId}` : `w:${log.wordId}`}`
    if (seenPerStudent.has(dedupKey)) continue
    seenPerStudent.add(dedupKey)

    if (log.word?.word) {
      const key = `w:${log.word.id}`
      const cur = buckets.get(key) ?? { word: log.word.word, count: 0, users: new Set<string>(), category: "vocab" }
      cur.count += 1
      cur.users.add(log.userId)
      buckets.set(key, cur)
      typeCounts.set("vocabulary", (typeCounts.get("vocabulary") ?? 0) + 1)
    } else if (log.question) {
      const { label, category } = summarizeQuestionConcept(log.question)
      const key = `q:${label.toLowerCase()}`
      const cur = buckets.get(key) ?? { word: label, count: 0, users: new Set<string>(), category }
      cur.count += 1
      cur.users.add(log.userId)
      buckets.set(key, cur)
      typeCounts.set(category, (typeCounts.get(category) ?? 0) + 1)
    }
  }

  const topErrors: TopErrorItem[] = [...buckets.values()]
    .sort((a, b) => b.count - a.count || b.users.size - a.users.size)
    .slice(0, 4)
    .map((b) => ({
      word: b.word,
      count: b.count,
      studentCount: b.users.size,
      category: b.category,
    }))

  const actionItems: ActionItem[] = []
  const now = new Date()
  const todayIdx = dayIndex(now)

  // 1. Top missed concept / exercise type
  if (topErrors.length > 0) {
    const top = topErrors[0]
    const topType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    actionItems.push({
      id: "top-concept",
      tone: "error",
      icon: "menu_book",
      title: `Focus concept: "${top.word}" (${top.count} student${top.count > 1 ? "s" : ""})`,
      detail:
        topType && topType[0] !== "vocabulary"
          ? `Currently unresolved for ${top.studentCount} student${top.studentCount > 1 ? "s" : ""}. Most open errors in this class are on ${topType[0]} questions (${topType[1]} open item${topType[1] > 1 ? "s" : ""}).`
          : `Currently unresolved for ${top.studentCount} student${top.studentCount > 1 ? "s" : ""}. Review "${top.word}" in context during your next class.`,
    })
  }

  // 2. Students with unresolved error debt
  const withDebt = students
    .filter((s) => (s.errorScore || 0) > 0)
    .sort((a, b) => (b.errorScore || 0) - (a.errorScore || 0))

  if (withDebt.length > 0) {
    const totalDebt = withDebt.reduce((sum, s) => sum + (s.errorScore || 0), 0)
    const names = withDebt
      .slice(0, 3)
      .map((s) => `${(s.name || s.email.split("@")[0]).trim()} (${s.errorScore} pts)`)
      .join(", ")
    actionItems.push({
      id: "error-debt",
      tone: "warning",
      icon: "assignment_late",
      title: `${withDebt.length} of ${students.length} student${withDebt.length > 1 ? "s" : ""} carry unresolved error debt (${totalDebt} pts total)`,
      detail: `Highest debt: ${names}${withDebt.length > 3 ? ` +${withDebt.length - 3} more` : ""}. Remind them to complete Review Mode to recover their GPA points.`,
    })
  }

  // 3. Weekly frequency & today's participation
  if (students.length > 0) {
    const studentDaysList = students.map((s) => {
      const dates = [
        ...s.sessions.map((x) => x.startTime),
        ...s.journalEntries.map((x) => x.createdAt),
        ...s.flashcardProgress.filter((x) => x.lastReviewAt != null).map((x) => x.lastReviewAt!),
        ...(s.streaks?.lastLogin ? [s.streaks.lastLogin] : []),
      ]
      return { s, days: studyDaySet(dates.map((d) => ({ startTime: d }))) }
    })

    const practicedTodayCount = studentDaysList.filter(({ days }) => days.has(todayIdx)).length
    const zeroThisWeek = studentDaysList
      .filter(({ days }) => studyWeek(days, now).filter(Boolean).length === 0)
      .map(({ s }) => s)

    if (zeroThisWeek.length > 0) {
      const inactiveNames = zeroThisWeek
        .slice(0, 3)
        .map((s) => (s.name || s.email.split("@")[0]).trim())
        .join(", ")
      actionItems.push({
        id: "weekly-inactive",
        tone: "info",
        icon: "event_busy",
        title: `${zeroThisWeek.length} student${zeroThisWeek.length > 1 ? "s" : ""} with 0 study days this week`,
        detail: `No activity since Monday: ${inactiveNames}${zeroThisWeek.length > 3 ? ` +${zeroThisWeek.length - 3} more` : ""}. Today's class participation: ${practicedTodayCount}/${students.length}.`,
      })
    } else {
      const activeStreaks = studentDaysList.filter(
        ({ s, days }) => Math.max(effectiveStreak(s.streaks, now), streakFromStudyDays(days, now)) > 0
      ).length
      actionItems.push({
        id: "weekly-active",
        tone: "success",
        icon: "verified",
        title: `All ${students.length} students have studied this week`,
        detail: `${practicedTodayCount}/${students.length} practiced today · ${activeStreaks}/${students.length} have an active daily streak.`,
      })
    }
  }

  if (actionItems.length === 0) {
    actionItems.push({
      id: "all-clear",
      tone: "success",
      icon: "check_circle",
      title: "Class is all clear",
      detail: "No open error logs or overdue revisions right now.",
    })
  }

  return {
    topErrors,
    actionItems,
    updatedAt: now.toISOString(),
  }
}

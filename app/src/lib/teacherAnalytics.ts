import { prisma } from "@/lib/prisma"
import { dayIndex, effectiveStreak, studyDaySet, studyWeek } from "@/lib/streak"

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

  // Aggregate missed concepts by word first, or by question concept when wordId is null
  const buckets = new Map<string, { word: string; count: number; users: Set<string>; category?: string }>()
  const typeCounts = new Map<string, number>()

  for (const log of errorLogs) {
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

  // Build real-time Action Items from live student & error data
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
      title: `Focus concept: "${top.word}" (${top.count} mistake${top.count > 1 ? "s" : ""})`,
      detail:
        topType && topType[0] !== "vocabulary"
          ? `Missed by ${top.studentCount} student${top.studentCount > 1 ? "s" : ""}. Most errors in this class are on ${topType[0]} exercises (${topType[1]} open log${topType[1] > 1 ? "s" : ""}).`
          : `Missed by ${top.studentCount} student${top.studentCount > 1 ? "s" : ""}. Review "${top.word}" in context during your next class.`,
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
      .map((s) => `${s.name || s.email.split("@")[0]} (${s.errorScore} pts)`)
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
    const practicedTodayCount = students.filter(
      (s) => !!s.streaks?.lastLogin && dayIndex(new Date(s.streaks.lastLogin)) === todayIdx
    ).length
    const zeroThisWeek = students.filter((s) => {
      const days = studyDaySet(s.sessions)
      return studyWeek(days, now).filter(Boolean).length === 0
    })

    if (zeroThisWeek.length > 0) {
      const inactiveNames = zeroThisWeek
        .slice(0, 3)
        .map((s) => s.name || s.email.split("@")[0])
        .join(", ")
      actionItems.push({
        id: "weekly-inactive",
        tone: "info",
        icon: "event_busy",
        title: `${zeroThisWeek.length} student${zeroThisWeek.length > 1 ? "s" : ""} with 0 study days this week`,
        detail: `No activity since Monday: ${inactiveNames}${zeroThisWeek.length > 3 ? ` +${zeroThisWeek.length - 3} more` : ""}. Today's class participation: ${practicedTodayCount}/${students.length}.`,
      })
    } else {
      const activeStreaks = students.filter((s) => effectiveStreak(s.streaks, now) > 0).length
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

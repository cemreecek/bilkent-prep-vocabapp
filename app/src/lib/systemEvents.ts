import { prisma } from "@/lib/prisma"

export type FeedEvent = {
  id: string
  title: string // may contain <strong>, all user text is escaped
  description?: string | null
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | string
  icon: string
  createdAt: string
  timeAgo: string
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!))

export function timeAgo(date: Date, now: Date = new Date()): string {
  const sec = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))
  if (sec < 45) return "just now"
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-GB", { timeZone: "Europe/Istanbul" })
}

const sessionLabel = (type: string) => {
  const t = (type || "").toLowerCase()
  if (t.startsWith("flashcard")) return { verb: "studied flashcards", icon: "style" }
  if (t === "review") return { verb: "completed a review session", icon: "replay" }
  return { verb: "completed a practice session", icon: "task_alt" }
}

/** Live activity feed built from real data (sign-ups, classes, study sessions, admin events). */
export async function getRecentEvents(limit = 12): Promise<FeedEvent[]> {
  const [sysEvents, users, classrooms, sessions] = await Promise.all([
    prisma.systemEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit }).catch(() => []),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.classroom.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, createdAt: true, teacher: { select: { name: true } } },
    }),
    prisma.session.findMany({
      orderBy: { startTime: "desc" },
      take: limit * 2,
      select: { id: true, type: true, startTime: true, user: { select: { name: true, email: true } } },
    }),
  ])

  const now = new Date()
  const items: (Omit<FeedEvent, "timeAgo" | "createdAt"> & { at: Date })[] = []

  for (const e of sysEvents as any[]) {
    items.push({ id: `sys-${e.id}`, title: e.title, description: e.description, type: e.type, icon: "", at: e.createdAt })
  }
  for (const u of users) {
    const who = esc(u.name || u.email)
    const role = u.role === "STUDENT" ? "student" : u.role === "TEACHER" ? "teacher" : "admin"
    items.push({ id: `user-${u.id}`, title: `New ${role} <strong>${who}</strong> joined`, type: "SUCCESS", icon: "person_add", at: u.createdAt })
  }
  for (const c of classrooms) {
    const by = c.teacher?.name ? ` for <strong>${esc(c.teacher.name)}</strong>` : ""
    items.push({ id: `class-${c.id}`, title: `Classroom <strong>${esc(c.name)}</strong> created${by}`, type: "INFO", icon: "school", at: c.createdAt })
  }
  for (const s of sessions) {
    const { verb, icon } = sessionLabel(s.type)
    const who = esc(s.user?.name || s.user?.email || "A student")
    items.push({ id: `sess-${s.id}`, title: `<strong>${who}</strong> ${verb}`, type: "INFO", icon, at: s.startTime })
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map(({ at, ...rest }) => ({ ...rest, createdAt: at.toISOString(), timeAgo: timeAgo(at, now) }))
}

/** Record an admin-visible event. Never throws. */
export async function logSystemEvent(title: string, type: string = "INFO", description?: string) {
  try {
    await prisma.systemEvent.create({ data: { title, type, description } })
  } catch (e) {
    console.error("Failed to log system event", e)
  }
}

export { esc as escapeHtml }

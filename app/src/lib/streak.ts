/**
 * Calendar-day streak helpers.
 * Days are counted in Turkey time (UTC+3, no DST) so a student practising at 01:00
 * local time counts for the new day, not the previous one.
 */
const DAY_MS = 86_400_000
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000

export const dayIndex = (d: Date) => Math.floor((d.getTime() + TZ_OFFSET_MS) / DAY_MS)

/** Streak value to store after a practice activity happening at `now`. */
export function nextStreak(
  streak: { currentStreak: number; lastLogin: Date | null } | null,
  now: Date
): number {
  if (!streak?.lastLogin) return 1
  const gap = dayIndex(now) - dayIndex(streak.lastLogin)
  if (gap <= 0) return Math.max(1, streak.currentStreak) // already practised today
  if (gap === 1) return Math.max(0, streak.currentStreak) + 1 // practised yesterday
  return 1 // missed at least one full day
}

/**
 * Streak value to DISPLAY. A stored streak is only still alive if the student
 * practised today or yesterday; otherwise it has lapsed and shows 0.
 */
export function effectiveStreak(
  streak: { currentStreak: number; lastLogin: Date | null } | null | undefined,
  now: Date = new Date()
): number {
  if (!streak?.lastLogin) return 0
  const gap = dayIndex(now) - dayIndex(new Date(streak.lastLogin))
  return gap <= 1 ? streak.currentStreak : 0
}

/* ---------- Study-day counters (weekly / monthly) ---------- */

/** Set of calendar days (Turkey time) on which the user has any study session. */
export function studyDaySet(sessions: { startTime: Date | string }[] | undefined | null): Set<number> {
  const set = new Set<number>()
  for (const s of sessions ?? []) set.add(dayIndex(new Date(s.startTime)))
  return set
}

/** Day index of the first day of the current month (Turkey time). Resets the monthly counter. */
export function monthStartIndex(now: Date = new Date()): number {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MS)
  return Math.floor(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) / DAY_MS)
}

/** Day index of this week's Monday (weeks run Monday-Sunday). 1970-01-01 was a Thursday. */
export function weekStartIndex(now: Date = new Date()): number {
  const d = dayIndex(now)
  return d - ((d + 3) % 7)
}

/** Number of distinct days studied since the 1st of the current month. */
export function studyDaysThisMonth(days: Set<number>, now: Date = new Date()): number {
  const from = monthStartIndex(now)
  const to = dayIndex(now)
  let n = 0
  for (const d of days) if (d >= from && d <= to) n++
  return n
}

/** [Mon..Sun] flags for the current week. */
export function studyWeek(days: Set<number>, now: Date = new Date()): boolean[] {
  const start = weekStartIndex(now)
  return Array.from({ length: 7 }, (_, i) => days.has(start + i))
}

/** Number of days in the current month (Turkey time). */
export function daysInCurrentMonth(now: Date = new Date()): number {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MS)
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate()
}

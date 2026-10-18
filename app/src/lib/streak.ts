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

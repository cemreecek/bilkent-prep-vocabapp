/**
 * SM-2 (SuperMemo 2) Algorithm Implementation
 * 
 * A simple yet effective algorithm for spaced repetition learning.
 * Used to determine when a user should review a word next.
 * 
 * Reference: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 */

interface FlashcardState {
  totalReviews: number
  correctCount: number
  easeFactor: number
  interval: number
  nextReviewAt: Date | null
  difficulty: number // 0-4 (0=again, 1=hard, 2=good, 3=easy, 4=very easy)
}

interface ReviewResult {
  difficulty: number // 0-4 from the user's response
  quality?: number // Optional: alternative quality metric (0-5)
}

/**
 * Calculate next review interval using SM-2 algorithm
 * @param state Current flashcard state
 * @param result Review result (difficulty 0-4)
 * @returns Updated flashcard state
 */
export function calculateNextReview(
  state: FlashcardState,
  result: ReviewResult
): FlashcardState {
  const { difficulty } = result
  const currentEaseFactor = state.easeFactor
  
  // Calculate new ease factor (SM-2 formula)
  let newEaseFactor = currentEaseFactor
  
  if (difficulty < 3) {
    // If user rated it as difficult or again
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2)
  } else if (difficulty >= 3) {
    // If user rated it as good or easy
    const adjustment = 0.1 - (5 - difficulty) * (0.08 + (5 - difficulty) * 0.02)
    newEaseFactor = Math.max(1.3, currentEaseFactor + adjustment)
  }
  
  // Calculate new interval based on review count
  let newInterval = 1
  
  if (difficulty < 3) {
    // Reset if user struggled
    newInterval = 1
  } else if (state.totalReviews === 0) {
    newInterval = 1
  } else if (state.totalReviews === 1) {
    newInterval = 3
  } else {
    newInterval = Math.round(state.interval * newEaseFactor)
  }
  
  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)
  
  return {
    totalReviews: state.totalReviews + 1,
    correctCount: difficulty >= 3 ? state.correctCount + 1 : state.correctCount,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    interval: newInterval,
    nextReviewAt: nextReviewDate,
    difficulty,
  }
}

/**
 * Determine if a card is due for review
 * @param nextReviewAt The calculated next review date
 * @returns true if the card should be reviewed now
 */
export function isCardDue(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return true
  return new Date() >= nextReviewAt
}

/**
 * Calculate review statistics
 * @param totalReviews Total number of times reviewed
 * @param correctCount Number of correct reviews
 * @returns Statistics object
 */
export function getReviewStats(totalReviews: number, correctCount: number) {
  return {
    accuracy: totalReviews > 0 ? (correctCount / totalReviews) * 100 : 0,
    totalReviews,
    correctCount,
    incorrectCount: totalReviews - correctCount,
  }
}

/**
 * Generate difficulty label for UI
 * @param difficulty 0-4 scale
 * @returns Human-readable label
 */
export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    0: 'Again',
    1: 'Hard',
    2: 'Good',
    3: 'Easy',
    4: 'Very Easy',
  }
  return labels[difficulty] || 'Unknown'
}

/**
 * Get recommended review time until next
 * @param interval Days until next review
 * @returns Human-readable time string
 */
export function getReviewTimeString(interval: number): string {
  if (interval === 0 || interval === 1) return 'Tomorrow'
  if (interval < 7) return `${interval} days`
  if (interval < 30) return `${Math.round(interval / 7)} weeks`
  if (interval < 365) return `${Math.round(interval / 30)} months`
  return `${Math.round(interval / 365)} years`
}

/**
 * Batch update multiple flashcards after a review session
 * @param cards Array of cards with their review results
 * @returns Updated card states
 */
export function batchUpdateFlashcards(
  cards: Array<{ state: FlashcardState; result: ReviewResult }>
): FlashcardState[] {
  return cards.map(({ state, result }) => calculateNextReview(state, result))
}

/** Normalise for comparison: trim, lowercase, collapse whitespace. */
export const normAnswer = (t: string) => (t || "").trim().toLowerCase().replace(/\s+/g, " ")

/** Split a stored answer into its accepted alternatives, e.g. "color | colour" or "color; colour". */
export function answerAlternatives(correct: string): string[] {
  return (correct || "")
    .split(/[|;]/)
    .map(normAnswer)
    .filter(Boolean)
}

/** True if the typed input equals any accepted alternative of the stored answer. */
export function matchesAnyAnswer(input: string, correct: string): boolean {
  const typed = normAnswer(input)
  if (!typed) return false
  return answerAlternatives(correct).includes(typed)
}

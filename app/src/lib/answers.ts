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

/* ---------------- Word bank ---------------- */

export interface BankOption {
  text: string
  isCorrect: boolean
  blankIndex?: number | null
}

/** Same regex the practice card uses to find blanks: {1}, (1), ___ {1}, or plain ___ . */
export const BLANK_SPLIT_RE = /((?:_{3,}\s*)?(?:\{|\()\d+(?:\}|\))|_{3,})/g

/** Blank numbers that actually appear in the question text, in order. */
export function blanksInText(question: string): number[] {
  const parts = (question || "").split(BLANK_SPLIT_RE)
  const out: number[] = []
  let counter = 0
  for (let i = 1; i < parts.length; i += 2) {
    const m = parts[i].match(/\d+/)
    if (m) out.push(parseInt(m[0], 10))
    else out.push(++counter)
  }
  return out
}

/**
 * Accepted answers for each blank in a word bank.
 * - Options marked isCorrect are the answers for their blank.
 * - Extra/distractor words (isCorrect = false) are ignored, whatever blank number they carry.
 * - Legacy data: a blank with exactly one option and no correct flag uses that option.
 * - Only blanks that appear in the question text are required (when the text has blanks).
 */
export function wordBankKey(options: BankOption[], question: string): Record<number, string[]> {
  const groups: Record<number, BankOption[]> = {}
  for (const o of options) {
    const k = o.blankIndex || 1
    ;(groups[k] ||= []).push(o)
  }
  const key: Record<number, string[]> = {}
  for (const [k, group] of Object.entries(groups)) {
    let correct = group.filter((o) => o.isCorrect)
    if (correct.length === 0 && group.length === 1) correct = group
    const accepted = correct.flatMap((o) => answerAlternatives(o.text))
    if (accepted.length) key[Number(k)] = accepted
  }
  const inText = blanksInText(question)
  if (inText.length === 0) return key
  const restricted: Record<number, string[]> = {}
  for (const b of inText) if (key[b]) restricted[b] = key[b]
  // If the text numbering doesn't line up with the stored blank numbers at all, fall back to the stored key.
  return Object.keys(restricted).length ? restricted : key
}

/** Grade a word bank. `answers` maps blank number -> chosen word text. */
export function gradeWordBank(
  options: BankOption[],
  question: string,
  answers: Record<number, string>
): { perBlank: Record<number, boolean>; allCorrect: boolean; required: number[] } {
  const key = wordBankKey(options, question)
  const required = Object.keys(key).map(Number).sort((a, b) => a - b)
  const perBlank: Record<number, boolean> = {}
  for (const b of required) perBlank[b] = key[b].includes(normAnswer(answers[b] || ""))
  return { perBlank, allCorrect: required.length > 0 && required.every((b) => perBlank[b]), required }
}

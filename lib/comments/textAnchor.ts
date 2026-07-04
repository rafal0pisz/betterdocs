export type TextAnchor = {
  quote: string
  prefix: string
  suffix: string
}

export type AnchorRange = {
  start: number
  end: number
}

const CONTEXT_LENGTH = 32

export function buildAnchor(fullText: string, start: number, end: number): TextAnchor {
  return {
    quote: fullText.slice(start, end),
    prefix: fullText.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: fullText.slice(end, end + CONTEXT_LENGTH),
  }
}

// Locates a previously captured quote (with surrounding context) inside `fullText`.
// When the quote occurs more than once, prefix/suffix context disambiguates the match.
export function findAnchorRange(fullText: string, anchor: TextAnchor): AnchorRange | null {
  const { quote, prefix, suffix } = anchor
  if (!quote) return null

  const candidates: number[] = []
  let idx = fullText.indexOf(quote)
  while (idx !== -1) {
    candidates.push(idx)
    idx = fullText.indexOf(quote, idx + 1)
  }
  if (candidates.length === 0) return null
  if (candidates.length === 1) {
    return { start: candidates[0], end: candidates[0] + quote.length }
  }

  let best = candidates[0]
  let bestScore = -1
  for (const start of candidates) {
    const end = start + quote.length
    const actualPrefix = fullText.slice(Math.max(0, start - prefix.length), start)
    const actualSuffix = fullText.slice(end, end + suffix.length)
    const score = commonSuffixLength(actualPrefix, prefix) + commonPrefixLength(actualSuffix, suffix)
    if (score > bestScore) {
      bestScore = score
      best = start
    }
  }
  return { start: best, end: best + quote.length }
}

function commonPrefixLength(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

function commonSuffixLength(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
  return i
}

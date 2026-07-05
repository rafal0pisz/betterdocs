export type HighlightRange = {
  id: string
  start: number
  end: number
}

// Returns the character offsets of the current selection relative to `container`'s
// text content, using the standard "range from container start to selection start"
// trick so no manual node walking is needed in this direction.
export function getSelectionOffsets(container: HTMLElement): { start: number; end: number; text: string } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null
  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null

  const preRange = document.createRange()
  preRange.selectNodeContents(container)
  preRange.setEnd(range.startContainer, range.startOffset)
  const start = preRange.toString().length
  const text = range.toString()
  if (!text) return null
  return { start, end: start + text.length, text }
}

export function clearHighlights(container: HTMLElement) {
  container.querySelectorAll('mark.comment-highlight').forEach((mark) => {
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  })
}

export function applyHighlights(container: HTMLElement, ranges: HighlightRange[]) {
  clearHighlights(container)
  if (ranges.length === 0) return

  const nonOverlapping: HighlightRange[] = []
  let lastEnd = -1
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    if (range.start >= lastEnd) {
      nonOverlapping.push(range)
      lastEnd = range.end
    }
  }

  for (const range of nonOverlapping) {
    for (const segment of resolveSegments(container, range.start, range.end)) {
      wrapRange(segment, range.id)
    }
  }
}

// A highlight must never end up straddling a table cell boundary: wrapping a
// range that partially crosses two different cells in the raw DOM produces
// invalid nesting and breaks the table's layout entirely. Highlights that
// span such a boundary (e.g. a quote covering two table cells) are instead
// split into one <mark> fragment per cell, all sharing the same comment id -
// visually contiguous, structurally safe.
//
// Text that sits directly inside a <table>/<tr> without being inside any
// <td>/<th> (e.g. whitespace between tags in the source markup) has no safe
// place for a <mark> at all - such a wrapper would itself become an invalid
// sibling of <td>. That text is skipped entirely rather than wrapped.
const SKIP = Symbol('skip')

function cellAncestor(node: Node, container: HTMLElement): Element | HTMLElement | typeof SKIP {
  let el: Element | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
  while (el && el !== container) {
    if (el.matches('td, th')) return el
    if (el.matches('table')) return SKIP
    el = el.parentElement
  }
  return container
}

// Walks the text nodes covering [start, end) and groups consecutive ones that
// share the same cell ancestor into a single Range each, dropping any that
// fall outside a valid cell.
function resolveSegments(container: HTMLElement, start: number, end: number): Range[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const segments: Range[] = []
  let offset = 0
  let currentAncestor: Element | HTMLElement | null = null
  let node: Text | null

  while ((node = walker.nextNode() as Text | null)) {
    const nodeStart = offset
    const nodeEnd = offset + node.data.length
    offset = nodeEnd
    if (nodeEnd <= start) continue
    if (nodeStart >= end) break

    const ancestor = cellAncestor(node, container)
    if (ancestor === SKIP) {
      currentAncestor = null
      continue
    }

    const segStart = Math.max(0, start - nodeStart)
    const segEnd = Math.min(node.data.length, end - nodeStart)

    const current = segments[segments.length - 1]
    if (current && ancestor === currentAncestor) {
      current.setEnd(node, segEnd)
    } else {
      const range = document.createRange()
      range.setStart(node, segStart)
      range.setEnd(node, segEnd)
      segments.push(range)
      currentAncestor = ancestor
    }
  }
  return segments
}

function wrapRange(range: Range, commentId: string) {
  // extractContents() can leave a now-empty inline ancestor behind when a
  // boundary sits inside it (e.g. highlighting from the very start of a
  // <strong> leaves a stray <strong></strong> next to the new <mark>).
  // Harmless when the element has no styling of its own, but elements like
  // <code> render a visible box even with no text - so prune them.
  const startParent = range.startContainer.parentElement
  const endParent = range.endContainer.parentElement

  const mark = document.createElement('mark')
  mark.className = 'comment-highlight'
  mark.dataset.commentId = commentId
  const fragment = range.extractContents()
  mark.appendChild(fragment)
  range.insertNode(mark)

  removeIfNowEmpty(startParent)
  removeIfNowEmpty(endParent)
}

function removeIfNowEmpty(el: Element | null) {
  // extractContents() can leave a zero-length text node behind rather than
  // removing it outright, so check textContent rather than childNodes.length.
  if (el && el.textContent === '' && el.tagName.toLowerCase() !== 'mark' && el.parentNode) {
    el.remove()
  }
}

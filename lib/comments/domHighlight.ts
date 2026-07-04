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

  // Apply from the end of the document backwards so earlier offsets stay valid
  // as later ranges mutate the DOM.
  for (const range of nonOverlapping.reverse()) {
    const domRange = offsetsToRange(container, range.start, range.end)
    if (!domRange) continue
    wrapRange(domRange, range.id)
  }
}

function offsetsToRange(container: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let offset = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let node: Text | null

  while ((node = walker.nextNode() as Text | null)) {
    const len = node.data.length
    if (startNode === null && offset + len >= start) {
      startNode = node
      startOffset = start - offset
    }
    if (endNode === null && offset + len >= end) {
      endNode = node
      endOffset = end - offset
      break
    }
    offset += len
  }
  if (!startNode || !endNode) return null

  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

function wrapRange(range: Range, commentId: string) {
  const mark = document.createElement('mark')
  mark.className = 'comment-highlight'
  mark.dataset.commentId = commentId
  const fragment = range.extractContents()
  mark.appendChild(fragment)
  range.insertNode(mark)
}

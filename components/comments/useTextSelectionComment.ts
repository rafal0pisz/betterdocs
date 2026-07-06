'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { Editor } from '@tiptap/core'
import { getSelectionOffsets } from '@/lib/comments/domHighlight'
import { buildAnchor, type TextAnchor } from '@/lib/comments/textAnchor'

// A commentable area of the page. `editor` is set only for a TipTap-managed
// region (the document body in the admin editor) - its presence tells
// CommentsPanel to highlight via ProseMirror decorations instead of raw DOM
// mutation, since directly editing a contentEditable's DOM would fight with
// ProseMirror's own re-rendering.
export type CommentRegion = {
  ref: RefObject<HTMLElement | null>
  editor?: Editor | null
}

export type PendingSelection = { anchor: TextAnchor; rect: DOMRect }

const SELECTION_SETTLE_MS = 250

export function useTextSelectionComment(regions: CommentRegion[]) {
  const [pending, setPending] = useState<PendingSelection | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const isComposerOpenRef = useRef(isComposerOpen)
  isComposerOpenRef.current = isComposerOpen

  const openComposer = useCallback(() => setIsComposerOpen(true), [])

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false)
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    function computePendingFromSelection() {
      if (isComposerOpenRef.current) return
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return
      const range = selection.getRangeAt(0)
      const container = regions.find((r) => r.ref.current?.contains(range.commonAncestorContainer))?.ref.current
      if (!container) return

      const offsets = getSelectionOffsets(container)
      if (!offsets || !offsets.text.trim()) return

      const fullText = container.textContent ?? ''
      const anchor = buildAnchor(fullText, offsets.start, offsets.end)
      const rect = range.getBoundingClientRect()
      setPending({ anchor, rect })
    }

    // Desktop: the mouse button release is a reliable "selection finished" signal.
    function handleMouseUp() {
      computePendingFromSelection()
    }

    // Touch devices select text by dragging native handles after a long-press,
    // which never fires mouseup. selectionchange does fire throughout that
    // drag, so debounce it and act once the selection settles.
    function handleSelectionChange() {
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(computePendingFromSelection, SELECTION_SETTLE_MS)
    }

    function handlePointerDown(event: Event) {
      const target = event.target as HTMLElement
      if (target.closest('[data-comment-composer]')) return
      if (isComposerOpenRef.current) {
        closeComposer()
      } else {
        setPending(null)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [regions, closeComposer])

  return { pending, isComposerOpen, openComposer, closeComposer }
}

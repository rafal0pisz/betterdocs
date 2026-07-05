'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
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

export function useTextSelectionComment(regions: CommentRegion[]) {
  const [pending, setPending] = useState<PendingSelection | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  const openComposer = useCallback(() => setIsComposerOpen(true), [])

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false)
    setPending(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    function handleMouseUp() {
      if (isComposerOpen) return
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

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest('[data-comment-composer]')) return
      if (isComposerOpen) {
        closeComposer()
      } else {
        setPending(null)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [regions, isComposerOpen, closeComposer])

  return { pending, isComposerOpen, openComposer, closeComposer }
}

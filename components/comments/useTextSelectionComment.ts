'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'
import { getSelectionOffsets } from '@/lib/comments/domHighlight'
import { buildAnchor, type TextAnchor } from '@/lib/comments/textAnchor'

export type PendingSelection = { anchor: TextAnchor; rect: DOMRect }

export function useTextSelectionComment(containerRef: RefObject<HTMLElement | null>) {
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
      const container = containerRef.current
      if (!container) return

      const offsets = getSelectionOffsets(container)
      if (!offsets || !offsets.text.trim()) return

      const fullText = container.textContent ?? ''
      const anchor = buildAnchor(fullText, offsets.start, offsets.end)
      const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect()
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
  }, [containerRef, isComposerOpen, closeComposer])

  return { pending, isComposerOpen, openComposer, closeComposer }
}

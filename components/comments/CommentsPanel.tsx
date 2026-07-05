'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createReply,
  createRootComment,
  deleteComment,
  getCommentsForDocument,
  updateComment,
  type AuthorType,
  type Comment,
  type CommentThread,
} from '@/lib/comments/queries'
import { applyHighlights, clearHighlights } from '@/lib/comments/domHighlight'
import { findAnchorRange } from '@/lib/comments/textAnchor'
import { useTextSelectionComment, type CommentRegion } from './useTextSelectionComment'

type Props = {
  documentId: string
  regions: CommentRegion[]
  authorType: AuthorType
  authorName: string
  authorClientId?: string
  onAuthorNameChange?: (name: string) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CommentsPanel({ documentId, regions, authorType, authorName, authorClientId, onAuthorNameChange }: Props) {
  const [threads, setThreads] = useState<CommentThread[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState(authorName)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { pending, isComposerOpen, openComposer, closeComposer } = useTextSelectionComment(regions)

  useEffect(() => {
    if (!nameDraft && authorName) setNameDraft(authorName)
  }, [authorName, nameDraft])

  const refresh = useCallback(async () => {
    setThreads(await getCommentsForDocument(documentId))
  }, [documentId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-anchor and highlight resolved threads whenever the comment list changes.
  // Each region resolves independently: a TipTap-backed region highlights via
  // ProseMirror decorations, everything else via direct DOM wrapping.
  useEffect(() => {
    const anchored = threads
      .filter((t) => t.quote)
      .map((t) => ({ id: t.id, anchor: { quote: t.quote as string, prefix: t.quote_prefix ?? '', suffix: t.quote_suffix ?? '' } }))

    const cleanups: Array<() => void> = []

    for (const region of regions) {
      if (region.editor) {
        region.editor.commands.setCommentHighlights(anchored)
        continue
      }

      const container = region.ref.current
      if (!container) continue
      const fullText = container.textContent ?? ''
      const ranges = anchored
        .map(({ id, anchor }) => {
          const range = findAnchorRange(fullText, anchor)
          return range ? { id, start: range.start, end: range.end } : null
        })
        .filter((r): r is { id: string; start: number; end: number } => r !== null)
      applyHighlights(container, ranges)
      cleanups.push(() => clearHighlights(container))
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [threads, regions])

  // Clicking a highlighted passage in any region opens the panel and jumps to its thread.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const mark = (event.target as HTMLElement).closest('[data-comment-id]') as HTMLElement | null
      const id = mark?.getAttribute('data-comment-id')
      if (!id) return
      setPanelOpen(true)
      setActiveThreadId(id)
    }
    const containers = regions.map((r) => r.ref.current).filter((c): c is HTMLElement => c !== null)
    containers.forEach((c) => c.addEventListener('click', handleClick))
    return () => containers.forEach((c) => c.removeEventListener('click', handleClick))
  }, [regions])

  useEffect(() => {
    if (!activeThreadId || !panelOpen) return
    panelRef.current?.querySelector(`[data-thread-id="${activeThreadId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeThreadId, panelOpen])

  const persistName = useCallback(
    (name: string) => {
      setNameDraft(name)
      if (authorType === 'portal') onAuthorNameChange?.(name)
    },
    [authorType, onAuthorNameChange]
  )

  const resolvedAuthorName = authorType === 'admin' ? authorName : nameDraft.trim()

  // Portal visitors have no accounts, so ownership is matched by a per-browser
  // id cookie instead. Admins are matched by their (unique) email/author_name.
  const isOwnComment = useCallback(
    (comment: Comment) => {
      if (comment.author_type !== authorType) return false
      if (authorType === 'admin') return comment.author_name === authorName
      return !!authorClientId && comment.author_client_id === authorClientId
    },
    [authorType, authorName, authorClientId]
  )

  // Admins moderate content, so they can delete any comment - but only edit
  // their own (editing someone else's words as an admin would be misleading).
  const canDelete = useCallback((comment: Comment) => authorType === 'admin' || isOwnComment(comment), [authorType, isOwnComment])

  const handleSubmitComment = useCallback(async () => {
    if (!pending || !commentDraft.trim() || !resolvedAuthorName) return
    setSubmitting(true)
    await createRootComment({
      documentId,
      authorType,
      authorName: resolvedAuthorName,
      authorClientId,
      content: commentDraft.trim(),
      anchor: pending.anchor,
    })
    setSubmitting(false)
    setCommentDraft('')
    closeComposer()
    setPanelOpen(true)
    await refresh()
  }, [pending, commentDraft, resolvedAuthorName, documentId, authorType, authorClientId, closeComposer, refresh])

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      const content = (replyDrafts[parentId] ?? '').trim()
      if (!content || !resolvedAuthorName) return
      setSubmitting(true)
      await createReply({ documentId, parentId, authorType, authorName: resolvedAuthorName, authorClientId, content })
      setSubmitting(false)
      setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
      await refresh()
    },
    [replyDrafts, resolvedAuthorName, documentId, authorType, authorClientId, refresh]
  )

  const handleUpdateComment = useCallback(
    async (id: string, content: string) => {
      await updateComment(id, content)
      await refresh()
    },
    [refresh]
  )

  const handleDeleteComment = useCallback(
    async (id: string) => {
      await deleteComment(id)
      await refresh()
    },
    [refresh]
  )

  return (
    <>
      {pending && !isComposerOpen && (
        <button
          type="button"
          data-comment-composer
          onClick={openComposer}
          style={{ position: 'fixed', top: pending.rect.bottom + 6, left: pending.rect.left }}
          className="z-50 flex items-center gap-1.5 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg hover:bg-gray-800"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Komentarz
        </button>
      )}

      {pending && isComposerOpen && (
        <div
          data-comment-composer
          style={{ position: 'fixed', top: pending.rect.bottom + 6, left: Math.min(pending.rect.left, window.innerWidth - 300) }}
          className="z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2"
        >
          <p className="text-xs text-gray-400 italic line-clamp-2">&ldquo;{pending.anchor.quote}&rdquo;</p>
          {authorType === 'portal' && (
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => persistName(e.target.value)}
              placeholder="Twoje imię"
              className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-gray-400"
            />
          )}
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Dodaj komentarz..."
            autoFocus
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-gray-400 resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={closeComposer} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={submitting || !commentDraft.trim() || !resolvedAuthorName}
              className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md disabled:opacity-40"
            >
              Dodaj
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-800"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Komentarze{threads.length > 0 ? ` (${threads.length})` : ''}
      </button>

      {panelOpen && (
        <div
          ref={panelRef}
          className="fixed right-4 bottom-20 z-40 w-80 max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-3"
        >
          {threads.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Brak komentarzy. Zaznacz fragment tekstu, aby dodać pierwszy.</p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.id}
              data-thread-id={thread.id}
              className={`border rounded-lg p-2.5 space-y-2 transition-colors ${
                activeThreadId === thread.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100'
              }`}
            >
              {thread.quote && (
                <p className="text-xs text-gray-400 italic border-l-2 border-amber-300 pl-2 line-clamp-2">&ldquo;{thread.quote}&rdquo;</p>
              )}
              <CommentRow
                comment={thread}
                canEdit={isOwnComment(thread)}
                canDelete={canDelete(thread)}
                onSave={(content) => handleUpdateComment(thread.id, content)}
                onDelete={() => handleDeleteComment(thread.id)}
              />
              {thread.replies.map((reply) => (
                <div key={reply.id} className="pl-3 border-l border-gray-100">
                  <CommentRow
                    comment={reply}
                    canEdit={isOwnComment(reply)}
                    canDelete={canDelete(reply)}
                    onSave={(content) => handleUpdateComment(reply.id, content)}
                    onDelete={() => handleDeleteComment(reply.id)}
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={replyDrafts[thread.id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitReply(thread.id)
                  }}
                  placeholder="Odpowiedz..."
                  className="flex-1 text-xs border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={() => handleSubmitReply(thread.id)}
                  disabled={submitting || !(replyDrafts[thread.id] ?? '').trim() || !resolvedAuthorName}
                  className="text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40 shrink-0"
                >
                  Wyślij
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function CommentRow({
  comment,
  canEdit,
  canDelete,
  onSave,
  onDelete,
}: {
  comment: { author_name: string; content: string; created_at: string }
  canEdit: boolean
  canDelete: boolean
  onSave: (content: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [busy, setBusy] = useState(false)

  if (isEditing) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-900">{comment.author_name}</span>
          <span className="text-[10px] text-gray-400">{formatDate(comment.created_at)}</span>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-gray-400 resize-none"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(comment.content)
              setIsEditing(false)
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Anuluj
          </button>
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={async () => {
              setBusy(true)
              await onSave(draft.trim())
              setBusy(false)
              setIsEditing(false)
            }}
            className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-md disabled:opacity-40"
          >
            Zapisz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-gray-900">{comment.author_name}</span>
        <span className="text-[10px] text-gray-400">{formatDate(comment.created_at)}</span>
        {(canEdit || canDelete) && (
          <span className="flex items-center gap-2 ml-auto">
            {canEdit && (
              <button type="button" onClick={() => setIsEditing(true)} className="text-[10px] text-gray-400 hover:text-gray-700">
                Edytuj
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm('Usunąć ten komentarz?')) return
                  setBusy(true)
                  await onDelete()
                }}
                className="text-[10px] text-gray-400 hover:text-red-600 disabled:opacity-40"
              >
                Usuń
              </button>
            )}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
    </div>
  )
}

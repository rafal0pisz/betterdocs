import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { findAnchorRange, type TextAnchor } from '@/lib/comments/textAnchor'

export type CommentAnchorItem = { id: string; anchor: TextAnchor }

type PluginState = { items: CommentAnchorItem[]; decorations: DecorationSet }

const commentPluginKey = new PluginKey<PluginState>('comment-highlights')

function textOffsetToPos(doc: ProseMirrorNode, offset: number): number {
  let remaining = offset
  let result: number | null = null
  doc.descendants((node, pos) => {
    if (result !== null) return false
    if (node.isText && node.text) {
      const len = node.text.length
      if (remaining <= len) {
        result = pos + remaining
        return false
      }
      remaining -= len
    }
    return true
  })
  return result ?? doc.content.size
}

function buildDecorations(doc: ProseMirrorNode, items: CommentAnchorItem[]): DecorationSet {
  const fullText = doc.textBetween(0, doc.content.size, '')
  const decorations: Decoration[] = []
  for (const item of items) {
    const range = findAnchorRange(fullText, item.anchor)
    if (!range) continue
    const from = textOffsetToPos(doc, range.start)
    const to = textOffsetToPos(doc, range.end)
    if (from >= to) continue
    decorations.push(Decoration.inline(from, to, { class: 'comment-highlight', 'data-comment-id': item.id }))
  }
  return DecorationSet.create(doc, decorations)
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentHighlight: {
      setCommentHighlights: (items: CommentAnchorItem[]) => ReturnType
    }
  }
}

export const CommentHighlightExtension = Extension.create({
  name: 'commentHighlight',

  addCommands() {
    return {
      setCommentHighlights:
        (items: CommentAnchorItem[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(commentPluginKey, items)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: commentPluginKey,
        state: {
          init: (_, { doc }) => ({ items: [], decorations: buildDecorations(doc, []) }),
          apply(tr, prev, _oldState, newState) {
            const meta = tr.getMeta(commentPluginKey) as CommentAnchorItem[] | undefined
            if (!meta && !tr.docChanged) return prev
            const items = meta ?? prev.items
            return { items, decorations: buildDecorations(newState.doc, items) }
          },
        },
        props: {
          decorations(state) {
            return commentPluginKey.getState(state)?.decorations
          },
        },
      }),
    ]
  },
})

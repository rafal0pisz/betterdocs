import { createClient } from '@/lib/supabase/client'
import type { TextAnchor } from './textAnchor'

export type AuthorType = 'admin' | 'portal'

export type Comment = {
  id: string
  document_id: string
  parent_id: string | null
  author_type: AuthorType
  author_name: string
  author_client_id: string | null
  quote: string | null
  quote_prefix: string | null
  quote_suffix: string | null
  content: string
  created_at: string
}

export type CommentThread = Comment & { replies: Comment[] }

export async function getCommentsForDocument(documentId: string): Promise<CommentThread[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
  if (error || !data) return []

  const repliesByParent = new Map<string, Comment[]>()
  for (const comment of data as Comment[]) {
    if (!comment.parent_id) continue
    const list = repliesByParent.get(comment.parent_id) ?? []
    list.push(comment)
    repliesByParent.set(comment.parent_id, list)
  }

  return (data as Comment[])
    .filter((comment) => !comment.parent_id)
    .map((comment) => ({ ...comment, replies: repliesByParent.get(comment.id) ?? [] }))
}

export async function createRootComment(params: {
  documentId: string
  authorType: AuthorType
  authorName: string
  authorClientId?: string
  content: string
  anchor: TextAnchor
}): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('document_comments').insert({
    document_id: params.documentId,
    author_type: params.authorType,
    author_name: params.authorName,
    author_client_id: params.authorClientId ?? null,
    content: params.content,
    quote: params.anchor.quote,
    quote_prefix: params.anchor.prefix,
    quote_suffix: params.anchor.suffix,
  })
  return { error: error?.message ?? null }
}

export async function createReply(params: {
  documentId: string
  parentId: string
  authorType: AuthorType
  authorName: string
  authorClientId?: string
  content: string
}): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('document_comments').insert({
    document_id: params.documentId,
    parent_id: params.parentId,
    author_type: params.authorType,
    author_name: params.authorName,
    author_client_id: params.authorClientId ?? null,
    content: params.content,
  })
  return { error: error?.message ?? null }
}

export async function updateComment(id: string, content: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('document_comments').update({ content }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteComment(id: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase.from('document_comments').delete().eq('id', id)
  return { error: error?.message ?? null }
}

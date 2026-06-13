import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug, getDocumentById } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import type { Section } from '@/types'

type Props = {
  params: Promise<{ slug: string; sectionId: string; docId: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function getSectionById(id: string): Promise<Section | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('sections').select('*').eq('id', id).single()
  return data
}

export default async function DocumentPage({ params }: Props) {
  const { slug, sectionId, docId } = await params
  const [client, section, document] = await Promise.all([
    getClientBySlug(slug),
    getSectionById(sectionId),
    getDocumentById(docId),
  ])
  if (!client || !section || !document) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">
          Overview
        </Link>
        <span>/</span>
        <Link href={`/portal/${slug}/${sectionId}`} className="hover:text-gray-600 transition-colors">
          {section.title}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{document.title}</span>
      </div>

      {/* Doc header */}
      <div className="mb-8 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{document.title}</h1>
        <p className="text-xs text-gray-400">
          Last updated: {formatDate(document.updated_at)}
        </p>
      </div>

      {/* Doc body */}
      {document.body ? (
        <div
          className="doc-body"
          dangerouslySetInnerHTML={{ __html: document.body }}
        />
      ) : (
        <p className="text-sm text-gray-400">This document is empty.</p>
      )}
    </div>
  )
}

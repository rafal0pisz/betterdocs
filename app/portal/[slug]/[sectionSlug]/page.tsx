import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientBySlug, getSectionBySlug, getDocumentsForSection, getEventsForSection } from '@/lib/queries'

type Props = { params: Promise<{ slug: string; sectionSlug: string }> }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-blue-50 text-blue-600',
}

export default async function SectionPage({ params }: Props) {
  const { slug, sectionSlug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const section = await getSectionBySlug(client.id, sectionSlug)
  if (!section) notFound()

  const [documents, events] = await Promise.all([
    getDocumentsForSection(section.id),
    getEventsForSection(section.id),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Overview</Link>
        <span>/</span>
        <span className="text-gray-600">{section.title}</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{section.title}</h1>

      {events.length === 0 && documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No published content in this section.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {events.map((event: any) => (
            <Link key={event.id} href={`/portal/${slug}/${sectionSlug}/event/${event.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">GA4</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono text-gray-900 group-hover:text-blue-600 transition-colors truncate">{event.name}</p>
                {event.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{event.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`}>{event.status}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          ))}
          {documents.map((doc) => (
            <Link key={doc.id} href={`/portal/${slug}/${sectionSlug}/${doc.slug}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-400">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Updated {formatDate(doc.updated_at)}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

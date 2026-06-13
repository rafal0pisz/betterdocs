import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getClientBySlug,
  getSectionsForClient,
  getAllDocumentsForClient,
} from '@/lib/queries'
import type { Section, Document } from '@/types'

type Props = { params: Promise<{ slug: string }> }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function SectionCard({ section, slug, docs }: { section: Section; slug: string; docs: Document[] }) {
  const sectionDocs = docs.filter((d) => d.section_id === section.id)
  return (
    <Link
      href={`/portal/${slug}/${section.id}`}
      className="block bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <p className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
        {section.title}
      </p>
      <p className="text-xs text-gray-400">
        {sectionDocs.length === 0
          ? 'Brak dokumentów'
          : `${sectionDocs.length} ${sectionDocs.length === 1 ? 'dokument' : 'dokumenty'}`}
      </p>
    </Link>
  )
}

export default async function PortalOverviewPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const [sections, recentDocs] = await Promise.all([
    getSectionsForClient(client.id),
    getAllDocumentsForClient(client.id),
  ])

  const visibleSections = sections.filter((s) => s.order_index > 0)
  const latestDocs = recentDocs.slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Dokumentacja analityczna
        </h1>
        <p className="text-sm text-gray-500">
          Wszystkie materiały wdrożeniowe i plany pomiarowe dla {client.name}.
        </p>
      </div>

      {/* Sections grid */}
      {visibleSections.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
            Sekcje
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {visibleSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                slug={slug}
                docs={recentDocs}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent docs */}
      {latestDocs.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
            Ostatnio zaktualizowane
          </h2>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {latestDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/portal/${slug}/${doc.section_id}/${doc.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-300 shrink-0">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                </svg>
                <span className="text-sm text-gray-700 flex-1 group-hover:text-gray-900 transition-colors">
                  {doc.title}
                </span>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDate(doc.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {visibleSections.length === 0 && latestDocs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Brak opublikowanych dokumentów.</p>
        </div>
      )}
    </div>
  )
}

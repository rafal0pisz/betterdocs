import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string }> }

export default async function ParametryPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('id, name, description, status, section_id, sections(title)')
    .eq('client_id', client.id)
    .eq('is_published', true)
    .order('name')

  const STATUS_LABELS: Record<string, string> = {
    'Planned': 'Planowany',
    'Implemented': 'Wdrożony',
    'To verify': 'Do weryfikacji',
  }
  const STATUS_COLORS: Record<string, string> = {
    'Planned': 'bg-gray-100 text-gray-500',
    'Implemented': 'bg-green-50 text-green-600',
    'To verify': 'bg-amber-50 text-amber-600',
  }

  // Grupuj eventy po sekcji
  const grouped = (events ?? []).reduce((acc: Record<string, typeof events>, event) => {
    const sectionTitle = (event.sections as any)?.title ?? 'Inne'
    if (!acc[sectionTitle]) acc[sectionTitle] = []
    acc[sectionTitle]!.push(event)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Przegląd</Link>
        <span>/</span>
        <span className="text-gray-600">Tabela eventów</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tabela eventów</h1>
      <p className="text-sm text-gray-500 mb-8">Wszystkie eventy analityczne zdefiniowane w dokumentacji.</p>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Brak eventów. Dodaj Tabelę Eventową w dokumencie.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([sectionTitle, sectionEvents]) => (
            <div key={sectionTitle}>
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">{sectionTitle}</h2>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-40">Event</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Opis / Parametry</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(sectionEvents ?? []).map((event) => {
                        const desc = event.description?.replace(/^\[doc:[^\]]+\]\s*/, '') ?? ''
                        return (
                          <tr key={event.id}>
                            <td className="px-5 py-3 font-mono text-sm text-gray-900 align-top">{event.name}</td>
                            <td className="px-5 py-3 text-sm text-gray-600 align-top">{desc || '—'}</td>
                            <td className="px-5 py-3 align-top">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
                                {STATUS_LABELS[event.status]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

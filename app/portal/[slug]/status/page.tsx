import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { JSDOM } from 'jsdom'

type Props = { params: Promise<{ slug: string }> }

function parseEventsFromHtml(html: string): string[] {
  const dom = new JSDOM(html)
  const labels = dom.window.document.querySelectorAll('p[data-event-label]')
  const events: string[] = []
  const seen = new Set<string>()
  labels.forEach((el) => {
    const name = el.textContent?.trim() ?? ''
    if (name && !seen.has(name)) { seen.add(name); events.push(name) }
  })
  return events
}

export default async function StatusPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()

  // Pobierz eventy z bazy (te z EventEditor)
  const { data: dbEvents } = await supabase
    .from('events')
    .select('id, name, status, sections(title)')
    .eq('client_id', client.id)
    .eq('is_published', true)

  // Pobierz eventy z dokumentów (te z EV label)
  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, body, section_id, sections(title)')
    .eq('client_id', client.id)
    .eq('is_published', true)

  // Zbierz EV eventy z dokumentów
  const docEvents: { name: string; docTitle: string; sectionTitle: string }[] = []
  const seenDoc = new Set<string>()
  ;(documents ?? []).forEach((doc) => {
    if (!doc.body) return
    parseEventsFromHtml(doc.body).forEach((name) => {
      if (!seenDoc.has(name)) {
        seenDoc.add(name)
        docEvents.push({
          name,
          docTitle: doc.title,
          sectionTitle: (doc.sections as any)?.title ?? '',
        })
      }
    })
  })

  const STATUS_LABELS: Record<string, string> = {
    'Planned': 'Planowane',
    'Implemented': 'Wdrożone',
    'To verify': 'Do weryfikacji',
  }
  const STATUS_COLORS: Record<string, string> = {
    'Planned': 'bg-gray-100 text-gray-500',
    'Implemented': 'bg-green-50 text-green-600',
    'To verify': 'bg-amber-50 text-amber-600',
  }

  const planned = (dbEvents ?? []).filter(e => e.status === 'Planned').length
  const implemented = (dbEvents ?? []).filter(e => e.status === 'Implemented').length
  const toVerify = (dbEvents ?? []).filter(e => e.status === 'To verify').length
  const total = (dbEvents ?? []).length
  const pct = total > 0 ? Math.round((implemented / total) * 100) : 0

  // Grupuj eventy z bazy po sekcji
  const grouped = (dbEvents ?? []).reduce((acc: Record<string, typeof dbEvents>, event) => {
    const key = (event.sections as any)?.title ?? 'Inne'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(event)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Przegląd</Link>
        <span>/</span>
        <span className="text-gray-600">Status zdarzeń</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Status zdarzeń</h1>

      {total === 0 && docEvents.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl text-gray-400">
          <p className="text-sm">Brak zdefiniowanych zdarzeń w dokumentacji.</p>
        </div>
      ) : (
        <>
          {/* Karty statystyk */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs text-gray-400 mb-1">Zaplanowane</p>
                <p className="text-3xl font-semibold text-gray-900">{planned}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs text-gray-400 mb-1">Wdrożone</p>
                <p className="text-3xl font-semibold" style={{ color: '#22c55e' }}>{implemented}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-xs text-gray-400 mb-1">Do weryfikacji</p>
                <p className="text-3xl font-semibold" style={{ color: '#f59e0b' }}>{toVerify}</p>
              </div>
            </div>
          )}

          {/* Pasek progresu */}
          {total > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900">Postęp wdrożenia</p>
                <p className="text-2xl font-semibold text-gray-900">{pct}%</p>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100
                      ? '#22c55e'
                      : pct >= 50
                      ? '#FF8282'
                      : '#fbbf24',
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{implemented} z {total} zdarzeń wdrożonych</p>
                {pct === 100 && (
                  <p className="text-xs text-green-600 font-medium">✓ Kompletne</p>
                )}
              </div>
            </div>
          )}

          {/* Tabela eventów z bazy */}
          {Object.keys(grouped).length > 0 && (
            <div className="space-y-4 mb-6">
              {Object.entries(grouped).map(([sectionTitle, events]) => (
                <div key={sectionTitle} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{sectionTitle}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(events ?? []).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-sm font-mono text-gray-900 flex-1">{event.name}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[event.status]}`}>
                          {STATUS_LABELS[event.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Eventy z dokumentów (EV label) */}
          {docEvents.length > 0 && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
                Zdarzenia z dokumentacji
              </h2>
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {docEvents.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <span className="font-mono text-sm font-medium flex-1" style={{ color: '#FF8282' }}>
                        {event.name}
                      </span>
                      <span className="text-xs text-gray-400">{event.sectionTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

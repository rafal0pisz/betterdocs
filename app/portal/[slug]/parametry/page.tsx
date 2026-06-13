import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'
import { JSDOM } from 'jsdom'

type Props = { params: Promise<{ slug: string }> }

type EventRow = {
  name: string
  docTitle: string
  docId: string
  sectionId: string
}

function parseEventsFromHtml(html: string): string[] {
  const dom = new JSDOM(html)
  const labels = dom.window.document.querySelectorAll('p[data-event-label]')
  const events: string[] = []
  const seen = new Set<string>()
  labels.forEach((el) => {
    const name = el.textContent?.trim() ?? ''
    if (name && !seen.has(name)) {
      seen.add(name)
      events.push(name)
    }
  })
  return events
}

export default async function ParametryPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()
  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, body, section_id, sections(title)')
    .eq('client_id', client.id)
    .eq('is_published', true)

  // Zbierz wszystkie eventy ze wszystkich dokumentów
  const allEvents: EventRow[] = []
  const seenGlobal = new Set<string>()

  ;(documents ?? []).forEach((doc) => {
    if (!doc.body) return
    const events = parseEventsFromHtml(doc.body)
    events.forEach((name) => {
      if (!seenGlobal.has(name)) {
        seenGlobal.add(name)
        allEvents.push({
          name,
          docTitle: doc.title,
          docId: doc.id,
          sectionId: doc.section_id,
        })
      }
    })
  })

  allEvents.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Przegląd</Link>
        <span>/</span>
        <span className="text-gray-600">Tabela eventów</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Tabela eventów</h1>
          <p className="text-sm text-gray-500">
            {allEvents.length === 0
              ? 'Brak eventów w dokumentacji.'
              : `${allEvents.length} unikalnych zdarzeń analitycznych`}
          </p>
        </div>
      </div>

      {allEvents.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl text-gray-400">
          <p className="text-sm">Brak eventów. Oznacz zdarzenia w dokumentach przyciskiem EV.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Event</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Dokument</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allEvents.map((event, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-medium" style={{ color: '#FF8282' }}>
                        {event.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/portal/${slug}/${event.sectionId}/${event.docId}`}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {event.docTitle}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

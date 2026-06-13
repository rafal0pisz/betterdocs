import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string }> }

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-blue-50 text-blue-600',
}

export default async function ParametryPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('structured_events')
    .select('*, documents(title, section_id, sections(title))')
    .eq('client_id', client.id)
    .order('name')

  const grouped = (events ?? []).reduce((acc: Record<string, typeof events>, event) => {
    const key = (event.documents as any)?.sections?.title ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(event)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Overview</Link>
        <span>/</span>
        <span className="text-gray-600">Events Table</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Events Table</h1>
          <p className="text-sm text-gray-500">
            {(events?.length ?? 0) === 0
              ? 'No events defined.'
              : `${events?.length} unique events`}
          </p>
        </div>
      </div>

      {(events?.length ?? 0) === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl text-gray-400">
          <p className="text-sm">No events yet. Add events using the EV button in the editor.</p>
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
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Event</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Description</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Parameters</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(sectionEvents ?? []).map((event: any) => (
                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm font-medium" style={{ color: '#FF8282' }}>{event.name}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{event.description || '—'}</td>
                          <td className="px-5 py-3 text-xs font-mono text-gray-500">{event.parameters || '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status] ?? ''}`}>{event.status}</span>
                          </td>
                        </tr>
                      ))}
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

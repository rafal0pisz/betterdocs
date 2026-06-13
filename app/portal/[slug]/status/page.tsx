import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string }> }

const STATUS_LABELS: Record<string, string> = {
  'Planned': 'Planned',
  'Implemented': 'Implemented',
  'To verify': 'To verify',
}

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-amber-50 text-amber-600',
}

export default async function StatusPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('structured_events')
    .select('*, documents(title, section_id, sections(title))')
    .eq('client_id', client.id)
    .order('name')

  const total = events?.length ?? 0
  const implemented = events?.filter(e => e.status === 'Implemented').length ?? 0
  const planned = events?.filter(e => e.status === 'Planned').length ?? 0
  const toVerify = events?.filter(e => e.status === 'To verify').length ?? 0
  const pct = total > 0 ? Math.round((implemented / total) * 100) : 0

  // Group by section
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
        <span className="text-gray-600">Event Status</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Event Status</h1>

      {total === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl text-gray-400">
          <p className="text-sm">No events defined yet. Use the EV button in the editor to add events.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Planned</p>
              <p className="text-3xl font-semibold text-gray-900">{planned}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Implemented</p>
              <p className="text-3xl font-semibold" style={{ color: '#22c55e' }}>{implemented}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">To verify</p>
              <p className="text-3xl font-semibold" style={{ color: '#f59e0b' }}>{toVerify}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-900">Implementation progress</p>
              <p className="text-2xl font-semibold text-gray-900">{pct}%</p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? '#22c55e' : pct >= 50 ? '#FF8282' : '#fbbf24',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">{implemented} of {total} events implemented</p>
              {pct === 100 && <p className="text-xs text-green-600 font-medium">✓ Complete</p>}
            </div>
          </div>

          {/* Events by section */}
          <div className="space-y-4">
            {Object.entries(grouped).map(([sectionTitle, sectionEvents]) => (
              <div key={sectionTitle} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{sectionTitle}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {(sectionEvents ?? []).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-sm font-mono text-gray-900 flex-1">{event.name}</span>
                      {event.description && (
                        <span className="text-xs text-gray-400 flex-1 truncate">{event.description}</span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`}>
                        {STATUS_LABELS[event.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

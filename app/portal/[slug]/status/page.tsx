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

function ProgressSection({ title, badge, total, implemented, planned, toVerify }: {
  title: string; badge: React.ReactNode; total: number; implemented: number; planned: number; toVerify: number
}) {
  const pct = total > 0 ? Math.round((implemented / total) * 100) : 0
  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2">
        {badge}
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Planned</p>
          <p className="text-3xl font-semibold text-gray-900">{planned}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Implemented</p>
          <p className="text-3xl font-semibold text-green-600">{implemented}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">To verify</p>
          <p className="text-3xl font-semibold text-amber-500">{toVerify}</p>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-900">Implementation progress</p>
          <p className="text-2xl font-semibold text-gray-900">{pct}%</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: pct === 100 ? '#22c55e' : pct >= 50 ? '#FF8282' : '#fbbf24' }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">{implemented} of {total} implemented</p>
          {pct === 100 && <p className="text-xs text-green-600 font-medium">✓ Complete</p>}
        </div>
      </div>
    </div>
  )
}

export default async function StatusPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const supabase = await createClient()
  const [{ data: events }, { data: parameters }] = await Promise.all([
    supabase.from('structured_events').select('*, documents(title, section_id, sections(title))').eq('client_id', client.id).order('name'),
    supabase.from('structured_parameters').select('*, documents(title, sections(title))').eq('client_id', client.id).order('name'),
  ])

  const evTotal = events?.length ?? 0
  const evImpl = events?.filter(e => e.status === 'Implemented').length ?? 0
  const evPlan = events?.filter(e => e.status === 'Planned').length ?? 0
  const evVer = events?.filter(e => e.status === 'To verify').length ?? 0

  const prTotal = parameters?.length ?? 0
  const prImpl = parameters?.filter(p => p.status === 'Implemented').length ?? 0
  const prPlan = parameters?.filter(p => p.status === 'Planned').length ?? 0
  const prVer = parameters?.filter(p => p.status === 'To verify').length ?? 0

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

      {evTotal === 0 && prTotal === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl text-gray-400">
          <p className="text-sm">No events or parameters defined yet.</p>
        </div>
      ) : (
        <>
          {/* Events progress */}
          {evTotal > 0 && (
            <ProgressSection
              title="Events"
              badge={<span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#FFF0F0', color: '#FF8282' }}>EV</span>}
              total={evTotal} implemented={evImpl} planned={evPlan} toVerify={evVer}
            />
          )}

          {/* Parameters progress */}
          {prTotal > 0 && (
            <ProgressSection
              title="Parameters"
              badge={<span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-900 text-white">EP</span>}
              total={prTotal} implemented={prImpl} planned={prPlan} toVerify={prVer}
            />
          )}

          {/* Events list by section */}
          {Object.keys(grouped).length > 0 && (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Events by section</h2>
              <div className="space-y-3">
                {Object.entries(grouped).map(([sectionTitle, sectionEvents]) => (
                  <div key={sectionTitle} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{sectionTitle}</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {(sectionEvents ?? []).map((event: any) => (
                        <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                          <span className="text-sm font-mono flex-1" style={{ color: '#FF8282' }}>{event.name}</span>
                          {event.description && <span className="text-xs text-gray-400 flex-1 truncate">{event.description}</span>}
                          <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 font-medium ${STATUS_COLORS[event.status]}`}>{event.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

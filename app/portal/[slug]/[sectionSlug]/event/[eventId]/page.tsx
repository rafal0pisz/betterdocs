import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug, getSectionBySlug, getEventById } from '@/lib/queries'

type Props = { params: Promise<{ slug: string; sectionSlug: string; eventId: string }> }

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-blue-50 text-blue-600',
}

const SCOPE_LABELS: Record<string, string> = { 'event': 'Event', 'user': 'User', 'item': 'Item' }

export default async function EventPortalPage({ params }: Props) {
  const { slug, sectionSlug, eventId } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const section = await getSectionBySlug(client.id, sectionSlug)
  if (!section) notFound()

  const event = await getEventById(eventId)
  if (!event) notFound()

  const params_sorted = [...(event.event_parameters ?? [])].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Overview</Link>
        <span>/</span>
        <Link href={`/portal/${slug}/${sectionSlug}`} className="hover:text-gray-600 transition-colors">{section.title}</Link>
        <span>/</span>
        <span className="text-gray-600 font-mono">{event.name}</span>
      </div>

      <div className="mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold font-mono text-gray-900 mb-2">{event.name}</h1>
            {event.description && <p className="text-sm text-gray-500 leading-relaxed">{event.description}</p>}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 font-medium ${STATUS_COLORS[event.status]}`}>{event.status}</span>
        </div>
      </div>

      {params_sorted.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Parameters</h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[560px] mx-4 md:mx-0 bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_2fr_80px] gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                {['Name', 'Scope', 'Type', 'Example', 'Required'].map(h => (
                  <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {params_sorted.map(p => (
                  <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_2fr_80px] gap-2 px-5 py-3 items-center">
                    <span className="text-sm font-mono text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded w-fit">{SCOPE_LABELS[p.scope]}</span>
                    <span className="text-xs text-gray-500 font-mono">{p.type}</span>
                    <span className="text-xs text-gray-600">{p.example_value || '—'}</span>
                    <span className={`text-xs w-fit px-2 py-0.5 rounded-full ${p.is_required ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                      {p.is_required ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

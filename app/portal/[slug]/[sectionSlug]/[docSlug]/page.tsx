import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug, getSectionBySlug, getDocumentBySlug } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string; sectionSlug: string; docSlug: string }> }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-blue-50 text-blue-600',
}

export default async function DocumentPage({ params }: Props) {
  const { slug, sectionSlug, docSlug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const section = await getSectionBySlug(client.id, sectionSlug)
  if (!section) notFound()

  const document = await getDocumentBySlug(section.id, docSlug)
  if (!document) notFound()

  const supabase = await createClient()
  const [{ data: events }, { data: parameters }] = await Promise.all([
    supabase.from('structured_events').select('*').eq('document_id', document.id).order('order_index'),
    supabase.from('structured_parameters').select('*').eq('document_id', document.id).order('order_index'),
  ])

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Overview</Link>
        <span>/</span>
        <Link href={`/portal/${slug}/${sectionSlug}`} className="hover:text-gray-600 transition-colors">{section.title}</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{document.title}</span>
      </div>

      <div className="mb-8 pb-6 border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{document.title}</h1>
        <p className="text-xs text-gray-400">Last updated: {formatDate(document.updated_at)}</p>
      </div>

      {document.body && (
        <div className="doc-body mb-10" dangerouslySetInnerHTML={{ __html: document.body }} />
      )}

      {events && events.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#FFF0F0', color: '#FF8282' }}>EV</span>
            <h2 className="text-sm font-semibold text-gray-900">Events</h2>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">Parameters</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((e: any) => (
                    <tr key={e.id}>
                      <td className="px-5 py-3 font-mono text-sm font-medium" style={{ color: '#FF8282' }}>{e.name}</td>
                      <td className="px-5 py-3 text-gray-600 text-sm">{e.description || '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">{e.parameters || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status] ?? ''}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {events.filter((e: any) => e.data_layer).length > 0 && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">dataLayer.push() examples</p>
                {events.filter((e: any) => e.data_layer).map((e: any) => (
                  <div key={e.id}>
                    <p className="text-xs font-mono font-medium mb-1.5" style={{ color: '#FF8282' }}>{e.name}</p>
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre">{e.data_layer}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {parameters && parameters.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-900 text-white">EP</span>
            <h2 className="text-sm font-semibold text-gray-900">Parameters</h2>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Parameter', 'Description', 'Type', 'Example', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parameters.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-mono text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-5 py-3 text-gray-600 text-sm">{p.description || '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{p.type}</td>
                      <td className="px-5 py-3 text-gray-500 text-sm">{p.example_value || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

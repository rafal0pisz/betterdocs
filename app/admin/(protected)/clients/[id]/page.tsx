import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { Client, Section, Document, GAEvent } from '@/types'
import DeleteClientButton from '@/components/admin/DeleteClientButton'

type Props = { params: Promise<{ id: string }> }

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function getData(id: string) {
  const supabase = await createSupabaseClient()
  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) return null
  const { data: sections } = await supabase.from('sections').select('*').eq('client_id', id).order('order_index')
  const { data: documents } = await supabase.from('documents').select('*').eq('client_id', id).order('order_index')
  const { data: events } = await supabase.from('events').select('*').eq('client_id', id).order('name')
  return {
    client: client as Client,
    sections: (sections ?? []) as Section[],
    documents: (documents ?? []) as Document[],
    events: (events ?? []) as GAEvent[],
  }
}

export default async function AdminClientPage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()
  const { client, sections, documents, events } = data

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <span className="text-gray-600">{client.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: client.accent_color }}>
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
            <a href={`/portal/${client.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline">
              /portal/{client.slug} ↗
            </a>
          </div>
        </div>
        <DeleteClientButton clientId={client.id} clientName={client.name} />
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const sectionDocs = documents.filter((d) => d.section_id === section.id)
          const sectionEvents = events.filter((e) => e.section_id === section.id)

          return (
            <div key={section.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-900">{section.title}</p>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/clients/${client.id}/${section.id}/events/new`}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Nowy event
                  </Link>
                  <Link
                    href={`/admin/clients/${client.id}/${section.id}/new`}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Nowy dokument
                  </Link>
                </div>
              </div>

              {sectionEvents.length === 0 && sectionDocs.length === 0 ? (
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-400">Brak dokumentów i eventów.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sectionEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/admin/clients/${client.id}/${section.id}/events/${event.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">E</span>
                      </div>
                      <span className="text-sm font-mono text-gray-900 flex-1 group-hover:text-blue-600 transition-colors">{event.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`}>
                        {STATUS_LABELS[event.status]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${event.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {event.is_published ? 'Opublikowany' : 'Szkic'}
                      </span>
                    </Link>
                  ))}
                  {sectionDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/admin/clients/${client.id}/${section.id}/${doc.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-300 shrink-0">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                      </svg>
                      <span className="text-sm text-gray-700 flex-1 group-hover:text-gray-900 transition-colors">{doc.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${doc.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {doc.is_published ? 'Opublikowany' : 'Szkic'}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(doc.updated_at)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

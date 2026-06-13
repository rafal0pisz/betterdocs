import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EventEditor from '@/components/admin/EventEditor'

type Props = { params: Promise<{ id: string; sectionId: string; eventId: string }> }

export default async function EditEventPage({ params }: Props) {
  const { id, sectionId, eventId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: section }, { data: event }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('sections').select('*').eq('id', sectionId).single(),
    supabase.from('events').select('*, event_parameters(*)').eq('id', eventId).single(),
  ])
  if (!client || !section || !event) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <Link href={`/admin/clients/${id}`} className="hover:text-gray-600 transition-colors">{client.name}</Link>
        <span>/</span>
        <span className="text-gray-600">{section.title}</span>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{event.name}</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6 font-mono">{event.name}</h1>
      <EventEditor event={event} sectionId={sectionId} clientId={id} />
    </div>
  )
}

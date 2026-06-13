import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EventEditor from '@/components/admin/EventEditor'

type Props = { params: Promise<{ id: string; sectionId: string }> }

export default async function NewEventPage({ params }: Props) {
  const { id, sectionId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: section }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('sections').select('*').eq('id', sectionId).single(),
  ])
  if (!client || !section) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <Link href={`/admin/clients/${id}`} className="hover:text-gray-600 transition-colors">{client.name}</Link>
        <span>/</span>
        <span className="text-gray-600">{section.title}</span>
        <span>/</span>
        <span className="text-gray-600">Nowy event</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nowy event</h1>
      <EventEditor sectionId={sectionId} clientId={id} isNew />
    </div>
  )
}

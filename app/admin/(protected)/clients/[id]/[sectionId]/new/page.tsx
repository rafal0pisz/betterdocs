import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DocumentEditor from '@/components/admin/DocumentEditor'

type Props = { params: Promise<{ id: string; sectionId: string }> }

export default async function NewDocumentPage({ params }: Props) {
  const { id, sectionId } = await params

  const supabase = await createClient()
  const { data: section } = await supabase
    .from('sections').select('*').eq('id', sectionId).single()
  if (!section) notFound()

  const { data: client } = await supabase
    .from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <Link href={`/admin/clients/${id}`} className="hover:text-gray-600 transition-colors">{client.name}</Link>
        <span>/</span>
        <span className="text-gray-600">{section.title}</span>
        <span>/</span>
        <span className="text-gray-600">Nowy dokument</span>
      </div>

      <DocumentEditor
        document={{ section_id: sectionId, client_id: id }}
        clientId={id}
        isNew
      />
    </div>
  )
}

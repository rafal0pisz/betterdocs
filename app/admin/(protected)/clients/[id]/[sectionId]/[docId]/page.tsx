import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DocumentEditor from '@/components/admin/DocumentEditor'

type Props = { params: Promise<{ id: string; sectionId: string; docId: string }> }

export default async function EditDocumentPage({ params }: Props) {
  const { id, sectionId, docId } = await params

  const supabase = await createClient()

  const [{ data: document }, { data: section }, { data: client }] = await Promise.all([
    supabase.from('documents').select('*').eq('id', docId).single(),
    supabase.from('sections').select('*').eq('id', sectionId).single(),
    supabase.from('clients').select('*').eq('id', id).single(),
  ])

  if (!document || !section || !client) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <Link href={`/admin/clients/${id}`} className="hover:text-gray-600 transition-colors">{client.name}</Link>
        <span>/</span>
        <span className="text-gray-600">{section.title}</span>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{document.title}</span>
      </div>

      <DocumentEditor
        document={document}
        clientId={id}
      />
    </div>
  )
}

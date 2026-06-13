import { notFound } from 'next/navigation'
import { getClientBySlug, getSectionsForClient } from '@/lib/queries'
import PortalSidebar from '@/components/portal/Sidebar'

type Props = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export default async function PortalLayout({ params, children }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  const sections = await getSectionsForClient(client.id)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PortalSidebar client={client} sections={sections} slug={slug} />
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}

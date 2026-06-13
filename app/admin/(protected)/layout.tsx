import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/Topbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  if (!allowedEmails.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopbar email={user.email ?? ''} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

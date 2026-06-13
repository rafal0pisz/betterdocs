'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <Link href="/admin" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75">
            <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-900">BetterDocs</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Admin</span>
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">{email}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Wyloguj
        </button>
      </div>
    </header>
  )
}

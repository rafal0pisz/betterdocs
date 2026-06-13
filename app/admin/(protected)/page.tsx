import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Client } from '@/types'

async function getAllClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminPage() {
  const clients = await getAllClients()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Klienci</h1>
          <p className="text-sm text-gray-400 mt-0.5">Zarządzaj portalami dokumentacji</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nowy klient
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
          <p className="text-sm text-gray-400">Brak klientów. Dodaj pierwszego.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: client.accent_color }}
              >
                {client.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{client.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  /portal/<span className="font-mono">{client.slug}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  client.is_active
                    ? 'bg-green-50 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {client.is_active ? 'Aktywny' : 'Nieaktywny'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-gray-300 group-hover:text-gray-400 transition-colors">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

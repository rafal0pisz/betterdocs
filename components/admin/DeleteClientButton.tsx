'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (input !== 'delete') return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    if (error) {
      setError('Błąd podczas usuwania. Spróbuj ponownie.')
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Usuń klienta
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.75">
                  <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Usuń klienta</h2>
              <p className="text-sm text-gray-500">
                Usunięcie <span className="font-medium text-gray-700">{clientName}</span> jest nieodwracalne. Wszystkie sekcje, dokumenty i eventy zostaną trwale usunięte.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Wpisz <span className="font-mono font-bold text-gray-900">delete</span> aby potwierdzić
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError('') }}
                placeholder="delete"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-300 transition-colors font-mono"
                autoFocus
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={input !== 'delete' || loading}
                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Usuwanie...' : 'Usuń klienta'}
              </button>
              <button
                onClick={() => { setShowModal(false); setInput('') }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

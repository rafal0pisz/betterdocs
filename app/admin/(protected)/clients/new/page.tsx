'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_SECTIONS = [
  { title: 'Overview',          icon: 'ti-layout-grid',    order_index: 0 },
  { title: 'Plan pomiarowy',    icon: 'ti-tags',           order_index: 1 },
  { title: 'GA4 / GTM',         icon: 'ti-brand-google',   order_index: 2 },
  { title: 'Consent Mode',      icon: 'ti-shield-check',   order_index: 3 },
  { title: 'Dashboards',        icon: 'ti-chart-bar',      order_index: 4 },
  { title: 'Audit',             icon: 'ti-file-analytics', order_index: 5 },
  { title: 'Links and access',  icon: 'ti-link',           order_index: 6 },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NewClientPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [accentColor, setAccentColor] = useState('#185FA5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(val: string) {
    setName(val)
    setSlug(slugify(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({ name, slug, accent_color: accentColor })
      .select()
      .single()

    if (clientError) {
      setError(clientError.message)
      setLoading(false)
      return
    }

    const { error: sectionsError } = await supabase.from('sections').insert(
      DEFAULT_SECTIONS.map((s) => ({
        ...s,
        client_id: client.id,
        slug: slugify(s.title),
      }))
    )

    if (sectionsError) {
      setError('Klient utworzony, ale sekcje nie zostały dodane: ' + sectionsError.message)
      setLoading(false)
      return
    }

    router.push(`/admin/clients/${client.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600 transition-colors">Klienci</Link>
        <span>/</span>
        <span className="text-gray-600">Nowy klient</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nowy klient</h1>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Nazwa klienta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="np. Orange Polska"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Slug URL</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">/portal/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="orange-polska"
              required
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Kolor akcentu</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <span className="text-sm font-mono text-gray-500">{accentColor}</span>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Tworzenie...' : 'Utwórz klienta'}
          </button>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Anuluj
          </Link>
        </div>

        <p className="text-xs text-gray-400 border-t border-gray-50 pt-4">
          Domyślne sekcje zostaną utworzone automatycznie.
        </p>
      </form>
    </div>
  )
}

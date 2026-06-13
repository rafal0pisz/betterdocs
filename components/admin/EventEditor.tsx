'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { GAEvent, EventParameter, ParamScope, ParamType } from '@/types'

type Props = {
  event?: GAEvent & { event_parameters: EventParameter[] }
  sectionId: string
  clientId: string
  isNew?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  'Planned': 'Planowany',
  'Implemented': 'Wdrożony',
  'To verify': 'Do weryfikacji',
}

const STATUS_COLORS: Record<string, string> = {
  'Planned': 'bg-gray-100 text-gray-600',
  'Implemented': 'bg-green-50 text-green-700',
  'To verify': 'bg-amber-50 text-amber-700',
}

const SCOPE_LABELS: Record<ParamScope, string> = {
  'event': 'Event',
  'user': 'User',
  'item': 'Item',
}

const TYPE_LABELS: Record<ParamType, string> = {
  'string': 'string',
  'number': 'number',
  'boolean': 'boolean',
}

type ParamRow = Omit<EventParameter, 'id' | 'event_id' | 'client_id' | 'created_at'> & { id?: string; _key: string }

function newParam(): ParamRow {
  return {
    _key: Math.random().toString(36).slice(2),
    name: '',
    scope: 'event',
    type: 'string',
    example_value: '',
    is_required: false,
    order_index: 0,
  }
}

export default function EventEditor({ event, sectionId, clientId, isNew = false }: Props) {
  const router = useRouter()
  const [name, setName] = useState(event?.name ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [status, setStatus] = useState<string>(event?.status ?? 'Planned')
  const [isPublished, setIsPublished] = useState(event?.is_published ?? false)
  const [params, setParams] = useState<ParamRow[]>(
    event?.event_parameters.map((p) => ({ ...p, _key: p.id })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addParam() {
    setParams((prev) => [...prev, { ...newParam(), order_index: prev.length }])
  }

  function removeParam(key: string) {
    setParams((prev) => prev.filter((p) => p._key !== key))
  }

  function updateParam(key: string, field: keyof ParamRow, value: unknown) {
    setParams((prev) => prev.map((p) => p._key === key ? { ...p, [field]: value } : p))
  }

  const handleSave = useCallback(async (publish?: boolean) => {
    if (!name.trim()) return
    setSaving(true)

    const supabase = createClient()
    const shouldPublish = publish !== undefined ? publish : isPublished

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      is_published: shouldPublish,
      section_id: sectionId,
      client_id: clientId,
    }

    let eventId = event?.id

    if (isNew) {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      if (error || !data) { setSaving(false); return }
      eventId = data.id
    } else {
      await supabase.from('events').update(payload).eq('id', eventId!)
      if (publish !== undefined) setIsPublished(publish)
    }

    // Zapisz parametry — usuń stare, wstaw nowe
    await supabase.from('event_parameters').delete().eq('event_id', eventId!)
    if (params.length > 0) {
      await supabase.from('event_parameters').insert(
        params.map((p, i) => ({
          event_id: eventId,
          client_id: clientId,
          name: p.name,
          scope: p.scope,
          type: p.type,
          example_value: p.example_value || null,
          is_required: p.is_required,
          order_index: i,
        }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)

    if (isNew) {
      router.replace(`/admin/clients/${clientId}/${sectionId}/events/${eventId}`)
    }
  }, [name, description, status, isPublished, params, event, sectionId, clientId, isNew, router])

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Nazwa + status */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Nazwa eventu</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. purchase"
            className="w-full px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Opis</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kiedy event się odpala..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
          <div className="flex gap-2">
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatus(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  status === val
                    ? `${STATUS_COLORS[val]} border-transparent`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parametry */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <p className="text-sm font-medium text-gray-900">Parametry</p>
          <button
            type="button"
            onClick={addParam}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Dodaj parametr
          </button>
        </div>

        {params.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-gray-400">Brak parametrów. Kliknij "Dodaj parametr".</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_80px_32px] gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100">
              {['Nazwa', 'Scope', 'Typ', 'Przykład', 'Wymagany', ''].map((h) => (
                <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {params.map((p) => (
                <div key={p._key} className="grid grid-cols-[2fr_1fr_1fr_2fr_80px_32px] gap-2 px-5 py-2.5 items-center">
                  <input
                    value={p.name}
                    onChange={(e) => updateParam(p._key, 'name', e.target.value)}
                    placeholder="nazwa_parametru"
                    className="px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  <select
                    value={p.scope}
                    onChange={(e) => updateParam(p._key, 'scope', e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {Object.entries(SCOPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select
                    value={p.type}
                    onChange={(e) => updateParam(p._key, 'type', e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                  >
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input
                    value={p.example_value ?? ''}
                    onChange={(e) => updateParam(p._key, 'example_value', e.target.value)}
                    placeholder="np. 99.99"
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={p.is_required}
                      onChange={(e) => updateParam(p._key, 'is_required', e.target.checked)}
                      className="w-4 h-4 accent-gray-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParam(p._key)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Akcje */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleSave()}
          disabled={saving || !name.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Zapisywanie...' : saved ? '✓ Zapisano' : 'Zapisz szkic'}
        </button>
        {!isPublished ? (
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Opublikuj
          </button>
        ) : (
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cofnij do szkicu
          </button>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full ${isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {isPublished ? 'Opublikowany' : 'Szkic'}
        </span>
      </div>
    </div>
  )
}

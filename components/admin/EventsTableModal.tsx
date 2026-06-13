'use client'

import { useState } from 'react'
import { GA4_STANDARD_EVENTS } from '@/lib/ga4-events'

export type EventRow = {
  _key: string
  name: string
  is_custom: boolean
  description: string
  status: 'Planned' | 'Implemented' | 'To verify'
}

type Props = {
  initialRows?: EventRow[]
  onInsert: (rows: EventRow[]) => void
  onClose: () => void
}

const STATUS_OPTIONS = ['Planned', 'Implemented', 'To verify']

function newRow(): EventRow {
  return { _key: Math.random().toString(36).slice(2), name: '', is_custom: false, description: '', status: 'Planned' }
}

export default function EventsTableModal({ initialRows, onInsert, onClose }: Props) {
  const [rows, setRows] = useState<EventRow[]>(initialRows && initialRows.length > 0 ? initialRows : [newRow()])
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [search, setSearch] = useState<Record<string, string>>({})

  function addRow() { setRows(p => [...p, newRow()]) }
  function removeRow(key: string) { setRows(p => p.filter(r => r._key !== key)) }
  function updateRow(key: string, field: keyof EventRow, value: unknown) {
    setRows(p => p.map(r => r._key === key ? { ...r, [field]: value } : r))
  }

  function selectEvent(key: string, name: string) {
    updateRow(key, 'name', name)
    updateRow(key, 'is_custom', false)
    setSearch(p => ({ ...p, [key]: name }))
    setShowDropdown(null)
  }

  function handleSearch(key: string, val: string) {
    setSearch(p => ({ ...p, [key]: val }))
    updateRow(key, 'name', val)
    updateRow(key, 'is_custom', true)
    setShowDropdown(key)
  }

  const filtered = (key: string) => {
    const q = (search[key] ?? '').toLowerCase()
    return q ? GA4_STANDARD_EVENTS.filter(e => e.name.includes(q)) : GA4_STANDARD_EVENTS
  }

  const validRows = rows.filter(r => r.name.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Events</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add or edit GA4 events</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="grid grid-cols-[2fr_2fr_1fr_28px] gap-2 mb-2">
            {['Event', 'Description', 'Status', ''].map(h => (
              <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-1">{h}</span>
            ))}
          </div>
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row._key} className="grid grid-cols-[2fr_2fr_1fr_28px] gap-2 items-start">
                <div className="relative">
                  <input
                    value={search[row._key] !== undefined ? search[row._key] : row.name}
                    onChange={e => handleSearch(row._key, e.target.value)}
                    onFocus={() => { setSearch(p => ({ ...p, [row._key]: row.name })); setShowDropdown(row._key) }}
                    onBlur={() => setTimeout(() => setShowDropdown(null), 150)}
                    placeholder="Search or type custom..."
                    className="w-full px-2.5 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  {showDropdown === row._key && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {(search[row._key] ?? '') && !GA4_STANDARD_EVENTS.find(e => e.name === search[row._key]) && (
                        <button onMouseDown={() => selectEvent(row._key, search[row._key] ?? '')}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100">
                          <span className="text-gray-400 mr-1">Custom:</span>
                          <span className="font-mono font-medium">{search[row._key]}</span>
                        </button>
                      )}
                      {Object.entries(filtered(row._key).reduce((acc: Record<string, string[]>, e) => {
                        if (!acc[e.category]) acc[e.category] = []
                        acc[e.category]!.push(e.name)
                        return acc
                      }, {})).map(([cat, names]) => (
                        <div key={cat}>
                          <div className="px-3 py-1 text-[10px] font-medium uppercase text-gray-400 bg-gray-50">{cat}</div>
                          {names.map(name => (
                            <button key={name} onMouseDown={() => selectEvent(row._key, name)}
                              className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50">{name}</button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input value={row.description} onChange={e => updateRow(row._key, 'description', e.target.value)}
                  placeholder="When does this fire..." className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
                <select value={row.status} onChange={e => updateRow(row._key, 'status', e.target.value)}
                  className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => removeRow(row._key)} disabled={rows.length === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
          <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add event
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">{validRows.length} event{validRows.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { onInsert(validRows); onClose() }} disabled={validRows.length === 0}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50">
              Save events
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

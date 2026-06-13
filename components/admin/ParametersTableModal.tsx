'use client'

import { useState } from 'react'
import { GA4_STANDARD_PARAMETERS } from '@/lib/ga4-events'

export type ParamRow = {
  _key: string
  name: string
  description: string
  type: 'string' | 'number' | 'boolean'
  example_value: string
  status: 'Planned' | 'Implemented' | 'To verify'
}

type Props = {
  onInsert: (rows: ParamRow[]) => void
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'Planned', label: 'Planned' },
  { value: 'Implemented', label: 'Implemented' },
  { value: 'To verify', label: 'To verify' },
]

const TYPE_OPTIONS = ['string', 'number', 'boolean']

function newRow(): ParamRow {
  return {
    _key: Math.random().toString(36).slice(2),
    name: '', description: '', type: 'string', example_value: '', status: 'Planned',
  }
}

export default function ParametersTableModal({ onInsert, onClose }: Props) {
  const [rows, setRows] = useState<ParamRow[]>([newRow()])
  const [search, setSearch] = useState<Record<string, string>>({})
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  function addRow() { setRows((prev) => [...prev, newRow()]) }
  function removeRow(key: string) { setRows((prev) => prev.filter((r) => r._key !== key)) }
  function updateRow(key: string, field: keyof ParamRow, value: unknown) {
    setRows((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r))
  }

  function selectParam(key: string, name: string, type: string) {
    updateRow(key, 'name', name)
    updateRow(key, 'type', type)
    setShowDropdown(null)
    setSearch((prev) => ({ ...prev, [key]: name }))
  }

  function handleSearchChange(key: string, val: string) {
    setSearch((prev) => ({ ...prev, [key]: val }))
    updateRow(key, 'name', val)
    setShowDropdown(key)
  }

  const filteredParams = (key: string) => {
    const q = (search[key] ?? '').toLowerCase()
    if (!q) return GA4_STANDARD_PARAMETERS
    return GA4_STANDARD_PARAMETERS.filter((p) => p.name.includes(q))
  }

  const validRows = rows.filter((r) => r.name.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Parameters Table</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define GA4 parameters for this document</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_28px] gap-2 mb-2">
            {['Parameter', 'Description', 'Type', 'Example', 'Status', ''].map((h) => (
              <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-gray-400 px-1">{h}</span>
            ))}
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row._key} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_28px] gap-2 items-start">
                {/* Parameter name */}
                <div className="relative">
                  <input
                    value={search[row._key] ?? row.name}
                    onChange={(e) => handleSearchChange(row._key, e.target.value)}
                    onFocus={() => setShowDropdown(row._key)}
                    onBlur={() => setTimeout(() => setShowDropdown(null), 150)}
                    placeholder="Search or custom..."
                    className="w-full px-2.5 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                  {showDropdown === row._key && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {search[row._key] && !GA4_STANDARD_PARAMETERS.find(p => p.name === search[row._key]) && (
                        <button
                          onMouseDown={() => selectParam(row._key, search[row._key] ?? '', 'string')}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100"
                        >
                          <span className="text-gray-400 mr-1">Custom:</span>
                          <span className="font-mono font-medium">{search[row._key]}</span>
                        </button>
                      )}
                      {filteredParams(row._key).map((p) => (
                        <button
                          key={p.name}
                          onMouseDown={() => selectParam(row._key, p.name, p.type)}
                          className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span>{p.name}</span>
                          <span className="text-gray-400 text-[10px]">{p.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  value={row.description}
                  onChange={(e) => updateRow(row._key, 'description', e.target.value)}
                  placeholder="Description..."
                  className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                />

                <select
                  value={row.type}
                  onChange={(e) => updateRow(row._key, 'type', e.target.value)}
                  className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white font-mono"
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                <input
                  value={row.example_value}
                  onChange={(e) => updateRow(row._key, 'example_value', e.target.value)}
                  placeholder="e.g. 99.99"
                  className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                />

                <select
                  value={row.status}
                  onChange={(e) => updateRow(row._key, 'status', e.target.value)}
                  className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <button
                  onClick={() => removeRow(row._key)}
                  disabled={rows.length === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>

          <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add parameter
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">{validRows.length} parameter{validRows.length !== 1 ? 's' : ''} defined</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onInsert(validRows); onClose() }}
              disabled={validRows.length === 0}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Insert table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

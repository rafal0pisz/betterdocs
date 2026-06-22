'use client'

import { useState, useTransition } from 'react'
import { savePortalPassword } from '@/app/admin/(protected)/clients/[id]/password-actions'

interface Props {
  clientId: string
  clientSlug: string
  currentPassword: string | null
}

export default function ClientPasswordSettings({
  clientId,
  clientSlug,
  currentPassword,
}: Props) {
  const [password, setPassword] = useState(currentPassword ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      await savePortalPassword(clientId, password.trim() || null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const handleClear = () => {
    setPassword('')
    startTransition(async () => {
      await savePortalPassword(clientId, null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const isProtected = !!currentPassword

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Portal access</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set a password to restrict access to this client&apos;s portal.
            Leave empty for public access.
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isProtected
              ? 'bg-amber-50 text-amber-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {isProtected ? 'Protected' : 'Public'}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="No password set"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none
            focus:border-[#FF8282] focus:ring-2 focus:ring-[#FF828220] transition-colors"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity
            hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#FF8282' }}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        {password && (
          <button
            onClick={handleClear}
            disabled={isPending}
            className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg
              hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Remove password (make portal public)"
          >
            Remove
          </button>
        )}
      </div>

      {isProtected && (
        <p className="mt-2 text-xs text-gray-400">
          Portal URL:{' '}
          <span className="font-mono text-gray-600">
            docs.bettersteps.pl/portal/{clientSlug}
          </span>
        </p>
      )}
    </div>
  )
}

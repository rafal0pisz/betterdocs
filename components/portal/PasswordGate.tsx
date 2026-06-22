'use client'

import { useSearchParams } from 'next/navigation'
import { verifyPortalPassword } from '@/app/portal/[slug]/actions'

interface Props {
  slug: string
  clientName: string
}

export default function PasswordGate({ slug, clientName }: Props) {
  const searchParams = useSearchParams()
  const hasError = searchParams.get('auth_error') === '1'

  const action = verifyPortalPassword.bind(null, slug)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ backgroundColor: '#FF8282' }}
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{clientName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the password to access this portal
          </p>
        </div>

        {/* Formularz */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form action={action} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors
                  focus:ring-2 focus:ring-offset-0
                  ${
                    hasError
                      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-[#FF8282] focus:ring-[#FF828220]'
                  }`}
                placeholder="Enter password"
              />
              {hasError && (
                <p className="mt-1.5 text-xs text-red-600">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 active:opacity-80"
              style={{ backgroundColor: '#FF8282' }}
            >
              Access portal
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-gray-400">
          Powered by{' '}
          <span className="font-medium" style={{ color: '#FF8282' }}>
            BetterDocs
          </span>
        </p>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Client, Section } from '@/types'

const ICONS: Record<string, React.ReactNode> = {
  'ti-layout-grid': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  'ti-tags': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 8a1 1 0 0 1 1-1h5.586a1 1 0 0 1 .707.293l6.414 6.414a2 2 0 0 1 0 2.828l-3.172 3.172a2 2 0 0 1-2.828 0L4.293 13.293A1 1 0 0 1 4 12.586V8z"/><circle cx="7.5" cy="11.5" r="1" fill="currentColor"/></svg>,
  'ti-brand-google': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17.788 5.108A9 9 0 1 0 21 12h-8"/></svg>,
  'ti-shield-check': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3"/><path d="m9 12 2 2 4-4"/></svg>,
  'ti-chart-bar': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="12" width="4" height="8" rx="1"/><rect x="9.5" y="8" width="4" height="12" rx="1"/><rect x="16" y="4" width="4" height="16" rx="1"/></svg>,
  'ti-file-analytics': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M9 17v-4"/><path d="M12 17v-2"/><path d="M15 17v-6"/></svg>,
  'ti-link': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  'ti-file': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>,
  'ti-mail': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
}

function Icon({ name }: { name: string }) {
  return ICONS[name] ?? ICONS['ti-file']
}

const ACCENT = '#FF8282'

type Props = { client: Client; sections: Section[]; slug: string }

export default function PortalSidebar({ client, sections, slug }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Zamknij menu po zmianie strony
  useEffect(() => { setOpen(false) }, [pathname])

  const navContent = (
    <>
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: client.accent_color || ACCENT }}
          >
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
            <p className="text-xs text-gray-400">Portal analityczny</p>
          </div>
        </div>
        {/* Przycisk zamknięcia na mobile */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Dokumentacja
        </p>
        {sections.map((section) => {
          const href = `/portal/${slug}/${section.id}`
          const overviewHref = `/portal/${slug}`
          const isOverview = section.order_index === 0
          const targetHref = isOverview ? overviewHref : href
          const isActive = isOverview ? pathname === overviewHref : pathname.startsWith(href)

          return (
            <Link
              key={section.id}
              href={targetHref}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors"
              style={isActive
                ? { backgroundColor: '#FFF0F0', color: ACCENT }
                : { color: '#6b7280' }
              }
            >
              <span className="shrink-0"><Icon name={section.icon} /></span>
              <span className="truncate">{section.title}</span>
            </Link>
          )
        })}
      </nav>



      {/* Status zdarzeń */}
      <div className="px-2 pb-1" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
        <Link
          href={`/portal/${slug}/status`}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors"
          style={pathname === `/portal/${slug}/status`
            ? { backgroundColor: '#FFF0F0', color: ACCENT }
            : { color: '#6b7280' }
          }
        >
          <span className="shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </span>
          <span className="truncate">Status zdarzeń</span>
        </Link>
      </div>
      {/* Tabela eventów */}
      <div className="px-2 pb-1" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
        <Link
          href={`/portal/${slug}/parametry`}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors"
          style={pathname === `/portal/${slug}/parametry`
            ? { backgroundColor: '#FFF0F0', color: ACCENT }
            : { color: '#6b7280' }
          }
        >
          <span className="shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </span>
          <span className="truncate">Tabela eventów</span>
        </Link>
      </div>
      {/* Kontakt */}
      <div className="px-2 pb-2 border-t border-gray-100 pt-2">
        <Link
          href={`/portal/${slug}/kontakt`}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors"
          style={pathname === `/portal/${slug}/kontakt`
            ? { backgroundColor: '#FFF0F0', color: ACCENT }
            : { color: '#6b7280' }
          }
        >
          <span className="shrink-0"><Icon name="ti-mail" /></span>
          <span className="truncate">Kontakt</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">
          Powered by <span className="font-medium text-gray-500">Bettersteps</span>
        </p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: client.accent_color || ACCENT }}
          >
            {client.name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Otwórz menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-white flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-gray-100 flex-col h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  )
}

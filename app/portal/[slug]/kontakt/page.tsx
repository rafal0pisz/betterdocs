import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientBySlug } from '@/lib/queries'

type Props = { params: Promise<{ slug: string }> }

export default async function ContactPage({ params }: Props) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client) notFound()

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/portal/${slug}`} className="hover:text-gray-600 transition-colors">Overview</Link>
        <span>/</span>
        <span className="text-gray-600">Contact</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Contact</h1>
      <p className="text-sm text-gray-500 mb-8">Masz pytania dotyczące documentacji lub wdrożenia? Napisz do nas.</p>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFFD73' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.75">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-0.5">Email</p>
            <a
              href="mailto:kontakt@bettersteps.pl"
              className="text-sm text-blue-600 hover:underline"
            >
              kontakt@bettersteps.pl
            </a>
            <p className="text-xs text-gray-400 mt-1">We respond within 1 business day.</p>
          </div>
        </div>

        <div className="border-t border-gray-50 mt-6 pt-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#1a1a1a' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFD73" strokeWidth="1.75">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-0.5">Bettersteps</p>
            <a
              href="https://bettersteps.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              bettersteps.pl
            </a>
            <p className="text-xs text-gray-400 mt-1">Web analytics agency.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl font-semibold text-gray-200 mb-4">404</p>
        <p className="text-sm text-gray-500 mb-6">Strona nie istnieje lub klient jest nieaktywny.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          Wróć na stronę główną
        </Link>
      </div>
    </div>
  )
}

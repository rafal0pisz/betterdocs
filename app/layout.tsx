import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BetterDocs',
  description: 'Portal dokumentacji analitycznej',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}

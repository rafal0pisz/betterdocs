import type { MetadataRoute } from 'next'

// This app is a private client portal (docs.bettersteps.pl) - it should
// never be indexed or crawled by search engines. Paired with the
// `robots: { index: false }` metadata in app/layout.tsx, which is the
// signal that actually removes pages from the index; this file additionally
// stops crawlers from requesting pages at all.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}

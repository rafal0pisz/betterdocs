'use client'

import { useEffect, useRef, useState } from 'react'
import CommentsPanel from '@/components/comments/CommentsPanel'

type Props = {
  html: string
  documentId: string
}

const NAME_COOKIE = 'portal_commenter_name'

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`
}

export default function DocumentBody({ html, documentId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [authorName, setAuthorName] = useState('')

  useEffect(() => {
    setAuthorName(getCookie(NAME_COOKIE))
  }, [])

  return (
    <>
      <div ref={containerRef} className="doc-body mb-10" dangerouslySetInnerHTML={{ __html: html }} />
      <CommentsPanel
        documentId={documentId}
        containerRef={containerRef}
        authorType="portal"
        authorName={authorName}
        onAuthorNameChange={(name) => {
          setAuthorName(name)
          setCookie(NAME_COOKIE, name)
        }}
      />
    </>
  )
}

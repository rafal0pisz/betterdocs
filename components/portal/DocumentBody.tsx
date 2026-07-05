'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import CommentsPanel from '@/components/comments/CommentsPanel'

type Props = {
  html: string | null
  documentId: string
  eventsSection?: ReactNode
  paramsSection?: ReactNode
}

const NAME_COOKIE = 'portal_commenter_name'
const CLIENT_ID_COOKIE = 'portal_commenter_id'

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`
}

// Portal visitors have no accounts, so a random id persisted per-browser is
// the only way to later recognize "this is my comment" for edit/delete.
function ensureClientId(): string {
  let id = getCookie(CLIENT_ID_COOKIE)
  if (!id) {
    id = crypto.randomUUID()
    setCookie(CLIENT_ID_COOKIE, id)
  }
  return id
}

export default function DocumentBody({ html, documentId, eventsSection, paramsSection }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef<HTMLDivElement>(null)
  const [authorName, setAuthorName] = useState('')
  const [authorClientId, setAuthorClientId] = useState('')

  useEffect(() => {
    setAuthorName(getCookie(NAME_COOKIE))
    setAuthorClientId(ensureClientId())
  }, [])

  return (
    <>
      {html && <div ref={bodyRef} className="doc-body mb-10" dangerouslySetInnerHTML={{ __html: html }} />}
      {eventsSection && <div ref={eventsRef}>{eventsSection}</div>}
      {paramsSection && <div ref={paramsRef}>{paramsSection}</div>}
      <CommentsPanel
        documentId={documentId}
        regions={[{ ref: bodyRef }, { ref: eventsRef }, { ref: paramsRef }]}
        authorType="portal"
        authorName={authorName}
        authorClientId={authorClientId}
        onAuthorNameChange={(name) => {
          setAuthorName(name)
          setCookie(NAME_COOKIE, name)
        }}
      />
    </>
  )
}

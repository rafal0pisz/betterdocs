'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types'
import EventsTableModal, { type EventRow } from './EventsTableModal'
import ParametersTableModal, { type ParamRow } from './ParametersTableModal'

const lowlight = createLowlight(common)

type Props = {
  document: Partial<Document> & { section_id: string; client_id: string }
  clientId: string
  isNew?: boolean
}

function Btn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
      {children}
    </button>
  )
}

function Divider() { return <div className="w-px h-4 bg-gray-200 mx-1" /> }

function addHeadingIds(html: string): string {
  return html.replace(/<(h[23])[^>]*>(.*?)<\/h[23]>/gi, (_, tag, content) => {
    const text = content.replace(/<[^>]+>/g, '')
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    return `<${tag} id="${id}">${content}</${tag}>`
  })
}

function generateToc(html: string): string {
  if (typeof window === 'undefined') return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  if (headings.length === 0) return ''
  const items = Array.from(headings).map((h) => {
    const level = h.tagName.toLowerCase()
    const text = h.textContent ?? ''
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const indent = level === 'h3' ? 'style="padding-left:1.25rem"' : ''
    return `<li ${indent}><a href="#${id}">${text}</a></li>`
  }).join('\n')
  return `<ul class="toc">\n${items}\n</ul>`
}

const STATUS_COLORS: Record<string, string> = {
  'Planned':     'bg-amber-100 text-amber-700',
  'Implemented': 'bg-green-100 text-green-700',
  'To verify':   'bg-blue-50 text-blue-600',
}

export default function DocumentEditor({ document, clientId, isNew = false }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(document.title ?? '')
  const [isPublished, setIsPublished] = useState(document.is_published ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  // Events & Params state (live outside editor)
  const [eventRows, setEventRows] = useState<EventRow[]>([])
  const [paramRows, setParamRows] = useState<ParamRow[]>([])
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [showParamsModal, setShowParamsModal] = useState(false)
  const [docId, setDocId] = useState<string | undefined>(document.id)

  // Load existing events/params on mount
  useEffect(() => {
    if (!document.id) return
    const supabase = createClient()
    supabase.from('structured_events').select('*').eq('document_id', document.id).order('order_index').then(({ data }) => {
      if (data) setEventRows(data.map((e: any) => ({
        _key: e.id, name: e.name, is_custom: e.is_custom, description: e.description ?? '', status: e.status,
      })))
    })
    supabase.from('structured_parameters').select('*').eq('document_id', document.id).order('order_index').then(({ data }) => {
      if (data) setParamRows(data.map((p: any) => ({
        _key: p.id, name: p.name, description: p.description ?? '', type: p.type, example_value: p.example_value ?? '', status: p.status,
      })))
    })
  }, [document.id])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'javascript' }),
    ],
    content: document.body ?? '',
    editorProps: { attributes: { class: 'doc-body outline-none min-h-[400px]' } },
  })

  const handleInsertToc = useCallback(() => {
    if (!editor) return
    const html = editor.getHTML()
    const toc = generateToc(html)
    if (!toc) { alert('No H2/H3 headings found.'); return }
    editor.chain().focus().insertContentAt(0, toc).run()
  }, [editor])

  const handleSetLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl) { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); return }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().setLink({ href: url }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  const saveEventsAndParams = useCallback(async (currentDocId: string, events: EventRow[], params: ParamRow[]) => {
    const supabase = createClient()
    await supabase.from('structured_events').delete().eq('document_id', currentDocId)
    await supabase.from('structured_parameters').delete().eq('document_id', currentDocId)
    if (events.length > 0) {
      await supabase.from('structured_events').insert(events.map((e, i) => ({
        client_id: document.client_id, document_id: currentDocId,
        name: e.name, is_custom: e.is_custom, description: e.description, status: e.status, order_index: i,
      })))
    }
    if (params.length > 0) {
      await supabase.from('structured_parameters').insert(params.map((p, i) => ({
        client_id: document.client_id, document_id: currentDocId,
        name: p.name, description: p.description, type: p.type, example_value: p.example_value, status: p.status, order_index: i,
      })))
    }
  }, [document.client_id])

  const handleSave = useCallback(async (publish?: boolean) => {
    if (!editor) return
    setSaving(true)
    const supabase = createClient()
    const rawHtml = editor.getHTML()
    const body = addHeadingIds(rawHtml)
    const shouldPublish = publish !== undefined ? publish : isPublished
    const payload = { title, body, is_published: shouldPublish, section_id: document.section_id, client_id: document.client_id }

    if (isNew) {
      const { data, error } = await supabase.from('documents').insert(payload).select().single()
      if (!error && data) {
        setDocId(data.id)
        await saveEventsAndParams(data.id, eventRows, paramRows)
        router.replace(`/admin/clients/${clientId}/${document.section_id}/${data.id}`)
      }
    } else {
      await supabase.from('documents').update(payload).eq('id', document.id!)
      await saveEventsAndParams(document.id!, eventRows, paramRows)
      if (publish !== undefined) setIsPublished(publish)
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [editor, title, isPublished, document, clientId, isNew, router, eventRows, paramRows, saveEventsAndParams])

  if (!editor) return null

  return (
    <div className="flex flex-col gap-4">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Document title"
        className="text-2xl font-semibold text-gray-900 bg-transparent border-0 outline-none placeholder-gray-300 w-full" />

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 bg-white border border-gray-100 rounded-lg flex-wrap">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><span className="text-xs font-bold">H2</span></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><span className="text-xs font-bold">H3</span></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        </Btn>
        <Divider />
        <Btn onClick={() => { if (editor.isActive('link')) { editor.chain().focus().unsetLink().run() } else { setLinkUrl(editor.getAttributes('link').href ?? ''); setShowLinkInput(v => !v) } }} active={editor.isActive('link')} title="Link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock({ language: 'javascript' }).run()} active={editor.isActive('codeBlock')} title="Code block">
          <span className="text-xs font-mono font-bold">JS</span>
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table" active={false}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </Btn>
        {editor.isActive('table') && (
          <>
            <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column"><span className="text-xs">+col</span></Btn>
            <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row"><span className="text-xs">+row</span></Btn>
            <Btn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column"><span className="text-xs">-col</span></Btn>
            <Btn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row"><span className="text-xs">-row</span></Btn>
            <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table"><span className="text-xs text-red-500">✕tbl</span></Btn>
          </>
        )}
        <Divider />
        <Btn onClick={handleInsertToc} title="Table of contents" active={false}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 5.1 5.1L3 7"/></svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18.9 5.1L21 7"/></svg>
        </Btn>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSetLink(); if (e.key === 'Escape') setShowLinkInput(false) }}
            placeholder="https://..." autoFocus className="flex-1 text-sm outline-none bg-transparent" />
          <button onClick={handleSetLink} className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-md">Add</button>
          <button onClick={() => setShowLinkInput(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white border border-gray-100 rounded-xl px-8 py-6">
        <EditorContent editor={editor} />
      </div>

      {/* Events section */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#FFF0F0', color: '#FF8282' }}>EV</span>
            <p className="text-sm font-medium text-gray-900">Events</p>
            <span className="text-xs text-gray-400">({eventRows.length})</span>
          </div>
          <button onClick={() => setShowEventsModal(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {eventRows.length === 0 ? 'Add events' : 'Edit events'}
          </button>
        </div>
        {eventRows.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-400">No events defined. Click "Add events" to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Event</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">Description</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-5 py-2.5 w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eventRows.map((e) => (
                  <tr key={e._key}>
                    <td className="px-5 py-2.5 font-mono text-sm font-medium" style={{ color: '#FF8282' }}>{e.name}</td>
                    <td className="px-5 py-2.5 text-gray-600 text-sm">{e.description || '—'}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Parameters section */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-900 text-white">EP</span>
            <p className="text-sm font-medium text-gray-900">Parameters</p>
            <span className="text-xs text-gray-400">({paramRows.length})</span>
          </div>
          <button onClick={() => setShowParamsModal(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {paramRows.length === 0 ? 'Add parameters' : 'Edit parameters'}
          </button>
        </div>
        {paramRows.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-400">No parameters defined. Click "Add parameters" to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Parameter', 'Description', 'Type', 'Example', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-5 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paramRows.map((p) => (
                  <tr key={p._key}>
                    <td className="px-5 py-2.5 font-mono text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-5 py-2.5 text-gray-600 text-sm">{p.description || '—'}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-500">{p.type}</td>
                    <td className="px-5 py-2.5 text-gray-500 text-sm">{p.example_value || '—'}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => handleSave()} disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save draft'}
        </button>
        {!isPublished ? (
          <button onClick={() => handleSave(true)} disabled={saving}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            Publish
          </button>
        ) : (
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Unpublish
          </button>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full ${isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {showEventsModal && (
        <EventsTableModal
          initialRows={eventRows}
          onInsert={(rows) => setEventRows(rows)}
          onClose={() => setShowEventsModal(false)}
        />
      )}
      {showParamsModal && (
        <ParametersTableModal
          initialRows={paramRows}
          onInsert={(rows) => setParamRows(rows)}
          onClose={() => setShowParamsModal(false)}
        />
      )}
    </div>
  )
}

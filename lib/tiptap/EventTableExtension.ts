import { Node, mergeAttributes } from '@tiptap/core'

export const EventTable = Node.create({
  name: 'eventTable',
  group: 'block',
  content: 'eventTableRow+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'table[data-event-table]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['table', mergeAttributes(HTMLAttributes, { 'data-event-table': 'true', class: 'event-table' }), 0]
  },
})

export const EventTableRow = Node.create({
  name: 'eventTableRow',
  group: 'eventTableRow',
  content: 'eventTableCell{3}',

  parseHTML() {
    return [{ tag: 'tr[data-event-row]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes, { 'data-event-row': 'true' }), 0]
  },
})

export const EventTableCell = Node.create({
  name: 'eventTableCell',
  group: 'eventTableCell',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'td[data-event-cell]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(HTMLAttributes, { 'data-event-cell': 'true' }), 0]
  },
})

// Pomocnik: wstawia pustą tabelę eventów z nagłówkiem
export function insertEventTable(editor: any) {
  const headerRow = {
    type: 'eventTableRow',
    content: [
      { type: 'eventTableCell', content: [{ type: 'text', text: 'Event' }] },
      { type: 'eventTableCell', content: [{ type: 'text', text: 'Opis' }] },
      { type: 'eventTableCell', content: [{ type: 'text', text: 'Parametry' }] },
    ],
  }
  const emptyRow = {
    type: 'eventTableRow',
    content: [
      { type: 'eventTableCell', content: [] },
      { type: 'eventTableCell', content: [] },
      { type: 'eventTableCell', content: [] },
    ],
  }

  editor.chain().focus().insertContent({
    type: 'eventTable',
    content: [headerRow, emptyRow, emptyRow],
  }).run()
}

// Parser: wyciąga eventy z HTML dokumentu
export function parseEventsFromHtml(html: string): Array<{
  name: string
  description: string
  parameters: string
}> {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table[data-event-table]')
  const events: Array<{ name: string; description: string; parameters: string }> = []

  tables.forEach((table) => {
    const rows = table.querySelectorAll('tr[data-event-row]')
    rows.forEach((row, i) => {
      if (i === 0) return // pomiń nagłówek
      const cells = row.querySelectorAll('td[data-event-cell]')
      if (cells.length < 1) return
      const name = cells[0]?.textContent?.trim() ?? ''
      if (!name) return
      events.push({
        name,
        description: cells[1]?.textContent?.trim() ?? '',
        parameters: cells[2]?.textContent?.trim() ?? '',
      })
    })
  })

  return events
}

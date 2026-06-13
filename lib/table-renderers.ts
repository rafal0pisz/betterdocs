import type { EventRow } from '@/components/admin/EventsTableModal'
import type { ParamRow } from '@/components/admin/ParametersTableModal'

const STATUS_BADGE: Record<string, string> = {
  'Planned':     'background:#f3f4f6;color:#6b7280',
  'Implemented': 'background:#f0fdf4;color:#16a34a',
  'To verify':   'background:#fffbeb;color:#d97706',
}

export function renderEventsTableHtml(rows: EventRow[]): string {
  const headerStyle = 'background:#FF8282;color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;text-align:left'
  const cellStyle = 'padding:8px 12px;vertical-align:top;border-bottom:1px solid #f3f4f6;font-size:13px;'

  const tableRows = rows.map((r) => {
    const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE['Planned']
    return `<tr>
      <td data-event-name style="${cellStyle}font-family:monospace;font-weight:600;color:#FF8282">${r.name}</td>
      <td style="${cellStyle}color:#374151">${r.description || '—'}</td>
      <td style="${cellStyle}"><span style="font-size:11px;padding:2px 8px;border-radius:9999px;${badge}">${r.status}</span></td>
    </tr>`
  }).join('\n')

  return `<table data-structured-events style="width:100%;border-collapse:collapse;border:2px solid #FF8282;border-radius:8px;overflow:hidden;margin-bottom:1rem">
  <thead>
    <tr>
      <th style="${headerStyle}">Event</th>
      <th style="${headerStyle}">Description</th>
      <th style="${headerStyle}">Status</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>`
}

export function renderParametersTableHtml(rows: ParamRow[]): string {
  const headerStyle = 'background:#1a1a1a;color:#fff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;text-align:left'
  const cellStyle = 'padding:8px 12px;vertical-align:top;border-bottom:1px solid #f3f4f6;font-size:13px;'

  const tableRows = rows.map((r) => {
    const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE['Planned']
    return `<tr>
      <td style="${cellStyle}font-family:monospace;font-weight:600;color:#374151">${r.name}</td>
      <td style="${cellStyle}color:#374151">${r.description || '—'}</td>
      <td style="${cellStyle}font-family:monospace;font-size:12px;color:#6b7280">${r.type}</td>
      <td style="${cellStyle}color:#6b7280">${r.example_value || '—'}</td>
      <td style="${cellStyle}"><span style="font-size:11px;padding:2px 8px;border-radius:9999px;${badge}">${r.status}</span></td>
    </tr>`
  }).join('\n')

  return `<table data-structured-params style="width:100%;border-collapse:collapse;border:2px solid #1a1a1a;border-radius:8px;overflow:hidden;margin-bottom:1rem">
  <thead>
    <tr>
      <th style="${headerStyle}">Parameter</th>
      <th style="${headerStyle}">Description</th>
      <th style="${headerStyle}">Type</th>
      <th style="${headerStyle}">Example</th>
      <th style="${headerStyle}">Status</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>`
}

// Parsuje HTML dokumentu i wyciąga eventy ze structured tables
export function parseStructuredEventsFromHtml(html: string, clientId: string, documentId: string) {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table[data-structured-events]')
  const events: any[] = []

  tables.forEach((table) => {
    const rows = table.querySelectorAll('tr')
    rows.forEach((row, i) => {
      if (i === 0) return // skip header
      const nameCell = row.querySelector('td[data-event-name]')
      const cells = row.querySelectorAll('td')
      if (!nameCell) return
      const name = nameCell.textContent?.trim() ?? ''
      if (!name) return
      const description = cells[1]?.textContent?.trim().replace('—', '') ?? ''
      const statusText = cells[2]?.textContent?.trim() ?? 'Planned'
      const status = ['Planned', 'Implemented', 'To verify'].includes(statusText) ? statusText : 'Planned'
      events.push({ client_id: clientId, document_id: documentId, name, description, status, is_custom: false, order_index: events.length })
    })
  })

  return events
}

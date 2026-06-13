import { Node, mergeAttributes } from '@tiptap/core'

// Prosty blok "Event" — jak nagłówek, ale oznacza nazwę eventu GA4
export const EventLabel = Node.create({
  name: 'eventLabel',
  group: 'block',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'p[data-event-label]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, {
      'data-event-label': 'true',
      class: 'event-label',
    }), 0]
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (!editor.isActive('eventLabel')) return false
        return editor.commands.setNode('paragraph')
      },
    }
  },
})

// Parser: wyciąga unikalne eventy z HTML dokumentu
export function parseEventsFromHtml(html: string): string[] {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const labels = doc.querySelectorAll('p[data-event-label]')
  const events: string[] = []
  const seen = new Set<string>()

  labels.forEach((el) => {
    const name = el.textContent?.trim() ?? ''
    if (name && !seen.has(name)) {
      seen.add(name)
      events.push(name)
    }
  })

  return events
}

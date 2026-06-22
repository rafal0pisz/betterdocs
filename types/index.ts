export type Client = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  accent_color: string
  is_active: boolean
  portal_password: string | null
  created_at: string
  updated_at: string
}
export type Section = {
  id: string
  client_id: string
  title: string
  slug: string
  icon: string
  order_index: number
  is_visible: boolean
  created_at: string
  updated_at: string
}
export type Document = {
  id: string
  section_id: string
  client_id: string
  title: string
  slug: string
  body: string | null
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}
export type SectionWithDocuments = Section & {
  documents: Document[]
}
export type ClientWithSections = Client & {
  sections: SectionWithDocuments[]
}
export type EventStatus = 'Planned' | 'Implemented' | 'To verify'
export type ParamScope = 'event' | 'user' | 'item'
export type ParamType = 'string' | 'number' | 'boolean'
export type GAEvent = {
  id: string
  client_id: string
  section_id: string
  name: string
  description: string | null
  status: EventStatus
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}
export type EventParameter = {
  id: string
  event_id: string
  client_id: string
  name: string
  scope: ParamScope
  type: ParamType
  example_value: string | null
  is_required: boolean
  order_index: number
  created_at: string
}
export type GAEventWithParameters = GAEvent & {
  event_parameters: EventParameter[]
}

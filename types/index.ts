export type Client = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  accent_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Section = {
  id: string
  client_id: string
  title: string
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

import { createClient } from '@/lib/supabase/server'
import type { Client, Section, Document } from '@/types'

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export async function getSectionsForClient(clientId: string): Promise<Section[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sections')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_visible', true)
    .order('order_index')
  return data ?? []
}

export async function getDocumentsForSection(sectionId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('section_id', sectionId)
    .eq('is_published', true)
    .order('order_index')
  return data ?? []
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()
  return data
}

export async function getAllDocumentsForClient(clientId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
  return data ?? []
}

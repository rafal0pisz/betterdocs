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

export async function getAllDocumentsForClient(clientId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*, sections(slug)')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
  return (data ?? []).map((d: any) => ({ ...d, section_slug: d.sections?.slug }))
}

export async function getEventsForSection(sectionId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*, event_parameters(*)')
    .eq('section_id', sectionId)
    .eq('is_published', true)
    .order('order_index')
  return data ?? []
}

export async function getAllEventsForClient(clientId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*, event_parameters(*)')
    .eq('client_id', clientId)
    .eq('is_published', true)
    .order('name')
  return data ?? []
}

export async function getEventById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*, event_parameters(*)')
    .eq('id', id)
    .single()
  return data
}

export async function getSectionBySlug(clientId: string, sectionSlug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sections')
    .select('*')
    .eq('client_id', clientId)
    .eq('slug', sectionSlug)
    .eq('is_visible', true)
    .single()
  return data
}

export async function getDocumentBySlug(sectionId: string, docSlug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('section_id', sectionId)
    .eq('slug', docSlug)
    .eq('is_published', true)
    .single()
  return data
}

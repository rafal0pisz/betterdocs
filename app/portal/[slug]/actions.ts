'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function verifyPortalPassword(slug: string, formData: FormData) {
  const entered = (formData.get('password') as string ?? '').trim()

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('portal_password')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  // Klient nie istnieje lub nie ma hasła — wejdź normalnie
  if (!client?.portal_password) {
    redirect(`/portal/${slug}`)
  }

  if (entered !== client.portal_password) {
    redirect(`/portal/${slug}?auth_error=1`)
  }

  // Hasło poprawne — ustaw cookie na 30 dni
  const cookieStore = await cookies()
  cookieStore.set(`portal_auth_${slug}`, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: `/portal/${slug}`,
  })

  redirect(`/portal/${slug}`)
}

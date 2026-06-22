'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function savePortalPassword(
  clientId: string,
  password: string | null
) {
  const supabase = await createClient()
  await supabase
    .from('clients')
    .update({ portal_password: password })
    .eq('id', clientId)

  revalidatePath(`/admin/(protected)/clients/${clientId}`)
}

/**
 * Supabase Admin Client — SERVER ONLY
 * Pakai service role key, bypass RLS.
 * JANGAN diimport dari komponen client atau file dengan 'use client'.
 */
import { createClient } from '@supabase/supabase-js'

if (typeof window !== 'undefined') {
  throw new Error('supabaseAdmin hanya boleh diimport dari server-side code')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

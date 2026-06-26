import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/** Typed client — untuk SELECT queries yang butuh autocomplete */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Untyped client — untuk INSERT/UPDATE/UPSERT/RPC
 * Menghindari `never[]` type error pada Supabase typed mutations.
 * Hasilnya sama di runtime — hanya berbeda di TS inference.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): ReturnType<typeof createBrowserClient<any>> {
  return createBrowserClient<unknown>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
}

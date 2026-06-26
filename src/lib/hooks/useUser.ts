'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
  role_id: string
  avatar_url: string | null
  status: string
}

export function useUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<CurrentUser | null> => {
      const supabase = createClient()

      // Cek sesi auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return null

      // Ambil profil user (tanpa join dulu)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: pErr } = await (supabase as any)
        .from('users')
        .select('id, name, email, avatar_url, status, role_id')
        .eq('id', authUser.id)
        .single() as { data: { id:string; name:string; email:string; avatar_url:string|null; status:string; role_id:string } | null; error: unknown }

      if (pErr || !profile) return null

      // Ambil nama role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: roleData } = await (supabase as any)
        .from('roles')
        .select('name')
        .eq('id', profile.role_id)
        .single() as { data: { name: string } | null }

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        status: profile.status,
        role_id: profile.role_id,
        role: (roleData?.name ?? 'feed_socmed') as Role,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

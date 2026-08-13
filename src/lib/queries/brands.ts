import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { Brand } from '@/types'

type RawRow = Record<string, unknown>

function mapBrand(b: RawRow): Brand {
  return {
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    color: (b.color as string | null) ?? '#7E997B',
    logo_url: (b.logo_url as string | null) ?? null,
    status: b.status as 'active' | 'inactive',
    repliz_ig_account_id: (b.repliz_ig_account_id as string | null) ?? null,
  }
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async (): Promise<Brand[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('brands')
        .select('*')
        .eq('status', 'active')
        .order('name') as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map(mapBrand)
    },
    staleTime: 10 * 60 * 1000,
  })
}

/** Semua brand termasuk inactive — dipakai halaman Settings */
export function useAllBrands() {
  return useQuery({
    queryKey: ['brands-all'],
    queryFn: async (): Promise<Brand[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('brands')
        .select('*')
        .order('name') as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map(mapBrand)
    },
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; color?: string; logo_url?: string; repliz_ig_account_id?: string }) => {
      const { error } = await db().from('brands').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] })
      qc.invalidateQueries({ queryKey: ['brands-all'] })
    },
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; name?: string; color?: string; logo_url?: string; status?: 'active' | 'inactive'; repliz_ig_account_id?: string | null }) => {
      const { error } = await db().from('brands').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] })
      qc.invalidateQueries({ queryKey: ['brands-all'] })
    },
  })
}

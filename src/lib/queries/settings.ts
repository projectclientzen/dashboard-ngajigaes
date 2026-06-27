import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Role, ProductType, ScoreSettings } from '@/types'

type RawRow = Record<string, unknown>

export interface UserWithRole {
  id: string
  name: string
  email: string
  role: Role
  role_id: string
  status: string
  joined_at: string | null
}

export function useTeamUsers() {
  return useQuery({
    queryKey: ['team-users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('users')
        .select('id, name, email, role_id, status, joined_at, role:roles(name)')
        .order('joined_at', { ascending: true }) as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((u) => ({
        id: u.id as string,
        name: u.name as string,
        email: u.email as string,
        role_id: u.role_id as string,
        role: ((u.role as { name: string } | null)?.name ?? 'feed_socmed') as Role,
        status: u.status as string,
        joined_at: u.joined_at as string | null,
      }))
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('roles').select('id, name').order('name')
      if (error) throw error
      return (data ?? []) as { id: string; name: Role }[]
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string; role_id: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal membuat user')
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-users'] })
      qc.invalidateQueries({ queryKey: ['all-users'] })
    },
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('users').update({ status: 'inactive' }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-users'] }),
  })
}

export interface ProductInput {
  id?: string
  name: string
  type: ProductType
  price: number
  status: 'active' | 'inactive'
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<ProductInput, 'id'>) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('products').insert(payload)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: ProductInput) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('products').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useScoreSettingsData() {
  return useQuery({
    queryKey: ['score-settings'],
    queryFn: async (): Promise<ScoreSettings & { id: string }> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('score_settings').select('*').single() as { data: RawRow | null; error: unknown }
      if (error) throw error
      return {
        id: data!.id as string,
        task_weight: Number(data!.task_weight),
        deadline_weight: Number(data!.deadline_weight),
        kpi_weight: Number(data!.kpi_weight),
        quality_weight: Number(data!.quality_weight),
        initiative_weight: Number(data!.initiative_weight),
      }
    },
  })
}

export function useUpdateScoreSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ScoreSettings & { id: string }) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('score_settings')
        .update({
          task_weight: payload.task_weight,
          deadline_weight: payload.deadline_weight,
          kpi_weight: payload.kpi_weight,
          quality_weight: payload.quality_weight,
          initiative_weight: payload.initiative_weight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['score-settings'] })
      qc.invalidateQueries({ queryKey: ['productivity-scores'] })
    },
  })
}

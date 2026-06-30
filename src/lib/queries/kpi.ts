import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { Kpi, KpiResult } from '@/types'

type RawRow = Record<string, unknown>

export function useKpis() {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async (): Promise<Kpi[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []) as Kpi[]
    },
  })
}

export function useKpiResults(userId: string, periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ['kpi-results', userId, periodStart, periodEnd],
    queryFn: async (): Promise<KpiResult[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('kpi_results')
        .select('*, kpi:kpis(name)')
        .eq('user_id', userId)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .order('created_at', { ascending: false }) as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((r) => ({
        kpi_id: r.kpi_id as string,
        kpi_name: (r.kpi as { name: string } | null)?.name ?? 'KPI',
        user_id: r.user_id as string,
        period_start: r.period_start as string,
        period_end: r.period_end as string,
        target_value: r.target_value as number,
        actual_value: r.actual_value as number,
        achievement_percentage: r.achievement_percentage as number,
        weighted_score: r.weighted_score as number,
      })) as KpiResult[]
    },
    enabled: !!userId,
  })
}

export function useAllKpiResults(periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ['all-kpi-results', periodStart, periodEnd],
    queryFn: async (): Promise<KpiResult[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('kpi_results')
        .select('*, kpi:kpis(name)')
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .order('user_id') as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((r) => ({
        kpi_id: r.kpi_id as string,
        kpi_name: (r.kpi as { name: string } | null)?.name ?? 'KPI',
        user_id: r.user_id as string,
        period_start: r.period_start as string,
        period_end: r.period_end as string,
        target_value: r.target_value as number,
        actual_value: r.actual_value as number,
        achievement_percentage: r.achievement_percentage as number,
        weighted_score: r.weighted_score as number,
      })) as KpiResult[]
    },
  })
}

export function useKpiActual(kpiId: string, userId: string, start: string, end: string) {
  return useQuery({
    queryKey: ['kpi-actual', kpiId, userId, start, end],
    queryFn: async (): Promise<number> => {
      const supabase = createClient()
      const { data, error } = await db().rpc('compute_kpi_actual', {
        p_kpi_id: kpiId, p_user_id: userId, p_start: start, p_end: end,
      })
      if (error) throw error
      return (data as number) ?? 0
    },
    enabled: !!(kpiId && userId && start && end),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateKpi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (kpi: {
      name: string; description?: string; category: string
      target_value: number; unit: string; weight: number
      period: string; calculation_method: string
      role_id?: string; user_id?: string
    }) => {
      const { error } = await db().from('kpis').insert({ ...kpi, is_active: true, max_score_cap: 100 })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  })
}

export function useUpdateKpi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...kpi }: {
      id: string; name: string; description?: string; category: string
      target_value: number; unit: string; weight: number
      period: string; calculation_method: string; user_id?: string
    }) => {
      const { error } = await db().from('kpis').update(kpi).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpis'] }),
  })
}

export function useUpsertKpiResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (result: {
      kpi_id: string; user_id: string; period_start: string; period_end: string
      target_value: number; actual_value: number; achievement_percentage: number
      weighted_score: number; input_type: 'manual' | 'automatic'; notes?: string
    }) => {
      const { error } = await db()
        .from('kpi_results')
        .upsert(result, { onConflict: 'kpi_id,user_id,period_start,period_end' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi-results'] })
      qc.invalidateQueries({ queryKey: ['all-kpi-results'] })
    },
  })
}

/** Ambil semua daily_reports user dalam range untuk recompute KPI */
export async function fetchDailyKpiEntries(
  userId: string, start: string, end: string
): Promise<{ kpi_id: string; qty: number }[]> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('daily_reports')
    .select('kpi_entries')
    .eq('user_id', userId)
    .gte('report_date', start)
    .lte('report_date', end)
  if (error) throw error

  // Akumulasi qty per kpi_id dari semua hari
  const totals: Record<string, number> = {}
  for (const row of (data ?? []) as { kpi_entries: { kpi_id: string; qty: number }[] | null }[]) {
    for (const entry of row.kpi_entries ?? []) {
      if (entry.kpi_id && entry.qty > 0) {
        totals[entry.kpi_id] = (totals[entry.kpi_id] ?? 0) + entry.qty
      }
    }
  }
  return Object.entries(totals).map(([kpi_id, qty]) => ({ kpi_id, qty }))
}

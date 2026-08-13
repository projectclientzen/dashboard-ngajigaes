import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { WeeklyReview } from '@/types'

type RawRow = Record<string, unknown>

export function useWeeklyReviews(brandId?: string | 'all') {
  return useQuery({
    queryKey: ['weekly-reviews', brandId],
    queryFn: async (): Promise<WeeklyReview[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb.from('weekly_reviews').select('*').order('period_start', { ascending: false })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((r) => ({
        id: r.id as string,
        period_start: r.period_start as string,
        period_end: r.period_end as string,
        revenue_summary: r.revenue_summary as Record<string, number> | null,
        task_summary: r.task_summary as Record<string, number> | null,
        kpi_summary: r.kpi_summary as Record<string, number> | null,
        instagram_summary: r.instagram_summary as Record<string, number> | null,
        main_problem: r.main_problem as string | null,
        leader_notes: r.leader_notes as string | null,
        decision: r.decision as string | null,
        brand_id: r.brand_id as string,
      }))
    },
  })
}

export function useUpsertWeeklyReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id?: string
      period_start: string
      period_end: string
      main_problem?: string
      leader_notes?: string
      decision?: string
      created_by?: string
      brand_id: string
    }) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('weekly_reviews')
        .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-reviews'] }),
  })
}

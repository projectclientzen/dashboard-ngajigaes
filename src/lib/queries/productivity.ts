import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { ProductivityScore, ScoreSettings } from '@/types'

type RawRow = Record<string, unknown>

export function useProductivityScores(periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ['productivity-scores', periodStart, periodEnd],
    queryFn: async (): Promise<ProductivityScore[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('productivity_scores')
        .select('*, user:users(name)')
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .order('final_score', { ascending: false }) as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((s) => ({
        user_id: s.user_id as string,
        user_name: (s.user as { name: string } | null)?.name ?? 'Unknown',
        period_start: s.period_start as string,
        period_end: s.period_end as string,
        task_completion_score: s.task_completion_score as number,
        deadline_accuracy_score: s.deadline_accuracy_score as number,
        kpi_score: s.kpi_score as number,
        quality_score: s.quality_score as number | null,
        initiative_score: s.initiative_score as number | null,
        final_score: s.final_score as number,
        status: s.status as ProductivityScore['status'],
      })) as ProductivityScore[]
    },
  })
}

export function useMyScore(userId: string, periodStart: string, periodEnd: string) {
  return useQuery({
    queryKey: ['my-score', userId, periodStart, periodEnd],
    queryFn: async (): Promise<ProductivityScore | null> => {
      if (!userId) return null
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('productivity_scores')
        .select('*, user:users(name)')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .maybeSingle() as { data: RawRow | null; error: unknown }

      if (error) throw error
      if (!data) return null
      return {
        user_id: data.user_id as string,
        user_name: (data.user as { name: string } | null)?.name ?? 'Unknown',
        period_start: data.period_start as string,
        period_end: data.period_end as string,
        task_completion_score: data.task_completion_score as number,
        deadline_accuracy_score: data.deadline_accuracy_score as number,
        kpi_score: data.kpi_score as number,
        quality_score: data.quality_score as number | null,
        initiative_score: data.initiative_score as number | null,
        final_score: data.final_score as number,
        status: data.status as ProductivityScore['status'],
      }
    },
    enabled: !!userId,
  })
}

export function useScoreSettings() {
  return useQuery({
    queryKey: ['score-settings'],
    queryFn: async (): Promise<ScoreSettings | null> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('score_settings')
        .select('task_weight, deadline_weight, kpi_weight, quality_weight, initiative_weight')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as ScoreSettings | null
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useComputeScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, start, end }: { userId: string; start: string; end: string }) => {
      const { error } = await db().rpc('compute_productivity_score', {
        p_user_id: userId, p_start: start, p_end: end,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productivity-scores'] }),
  })
}

export function useUpdateQualityScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId, periodStart, periodEnd, qualityScore, initiativeScore,
    }: {
      userId: string; periodStart: string; periodEnd: string
      qualityScore: number; initiativeScore: number
    }) => {
      const { error } = await db()
        .from('productivity_scores')
        .update({ quality_score: qualityScore, initiative_score: initiativeScore })
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productivity-scores'] }),
  })
}

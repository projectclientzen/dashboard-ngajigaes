import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import { todayJakarta } from '@/lib/utils'
import type { DailyReport } from '@/types'

export function useDailyReports(date?: string, userId?: string) {
  const targetDate = date ?? todayJakarta()
  return useQuery({
    queryKey: ['daily-reports', targetDate, userId],
    queryFn: async (): Promise<DailyReport[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let query = sb
        .from('daily_reports')
        .select('*, user:users(name)')
        .eq('report_date', targetDate)
        .order('created_at', { ascending: false })

      if (userId) query = query.eq('user_id', userId)

      const { data, error } = await query as { data: Record<string, unknown>[] | null; error: unknown }
      if (error) throw error

      return (data ?? []).map((r) => ({
        id: r.id as string,
        user_id: r.user_id as string,
        user_name: (r.user as { name: string } | null)?.name ?? 'Unknown',
        report_date: r.report_date as string,
        plan_today: r.plan_today as string | null,
        completed_work: r.completed_work as string | null,
        unfinished_work: r.unfinished_work as string | null,
        blockers: r.blockers as string | null,
        ideas_insights: r.ideas_insights as string | null,
        notes: r.notes as string | null,
        work_link: r.work_link as string | null,
        kpi_entries: (r.kpi_entries as { kpi_id: string; qty: number }[] | null) ?? [],
      })) as DailyReport[]
    },
  })
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, name, status, role_id')
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return (data ?? []) as { id: string; name: string; status: string; role_id: string }[]
    },
  })
}

export function useUpsertDailyReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (report: {
      user_id: string
      report_date: string
      plan_today?: string
      completed_work?: string
      unfinished_work?: string
      blockers?: string
      ideas_insights?: string
      notes?: string
      work_link?: string
      kpi_entries?: { kpi_id: string; qty: number }[]
    }) => {
      const { error } = await db()
        .from('daily_reports')
        .upsert(report, { onConflict: 'user_id,report_date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-reports'] }),
  })
}

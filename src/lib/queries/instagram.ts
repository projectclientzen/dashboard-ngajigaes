import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { AccountInsight, ContentInsight } from '@/types'

type RawRow = Record<string, unknown>

export function useAccountInsights(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['account-insights', start, end, brandId],
    queryFn: async (): Promise<AccountInsight[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('account_insight_view')
        .select('*')
        .gte('insight_date', start)
        .lte('insight_date', end)
        .order('insight_date', { ascending: true })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((d) => ({
        id: (d as RawRow).id as string,
        insight_date: (d as RawRow).insight_date as string,
        followers: (d as RawRow).followers as number | null,
        follower_growth: (d as RawRow).follower_growth as number | null,
        reach: (d as RawRow).reach as number | null,
        impressions: (d as RawRow).impressions as number | null,
        profile_visits: (d as RawRow).profile_visits as number | null,
        link_clicks: (d as RawRow).link_clicks as number | null,
        dm_count: (d as RawRow).dm_count as number | null,
        total_likes: (d as RawRow).total_likes as number | null,
        total_comments: (d as RawRow).total_comments as number | null,
        total_saves: (d as RawRow).total_saves as number | null,
        total_shares: (d as RawRow).total_shares as number | null,
        follows_count: (d as RawRow).follows_count as number | null,
        unfollows_count: (d as RawRow).unfollows_count as number | null,
        engagement_rate: (d as RawRow).engagement_rate as number | null,
        notes: (d as RawRow).notes as string | null,
        brand_id: (d as RawRow).brand_id as string,
        updated_at: (d as RawRow).updated_at as string | null,
      })) as AccountInsight[]
    },
  })
}

export function useContentInsights(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['content-insights', start, end, brandId],
    queryFn: async (): Promise<ContentInsight[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('content_insight_view')
        .select('*, content:contents(title, format, theme)')
        .gte('insight_date', start)
        .lte('insight_date', end)
        .order('reach', { ascending: false })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((c) => ({
        id: c.id as string,
        content_id: c.content_id as string,
        content_title: (c.content as { title: string } | null)?.title ?? '—',
        content_format: (c.content as { format: ContentInsight['content_format'] } | null)?.format ?? null,
        content_theme: (c.content as { theme: string | null } | null)?.theme ?? null,
        insight_date: c.insight_date as string,
        reach: c.reach as number | null,
        impressions: c.impressions as number | null,
        likes: c.likes as number | null,
        comments: c.comments as number | null,
        saves: c.saves as number | null,
        shares: c.shares as number | null,
        profile_visits: c.profile_visits as number | null,
        link_clicks: c.link_clicks as number | null,
        dm_generated: c.dm_generated as number | null,
        engagement_rate: c.engagement_rate as number | null,
        performance_status: c.performance_status as ContentInsight['performance_status'],
        evaluation_notes: c.evaluation_notes as string | null,
        brand_id: c.brand_id as string,
      })) as ContentInsight[]
    },
  })
}

export function useUpsertAccountInsight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (insight: {
      insight_date: string; followers?: number; reach?: number
      impressions?: number; profile_visits?: number; link_clicks?: number
      dm_count?: number; total_likes?: number; total_comments?: number
      total_saves?: number; total_shares?: number; notes?: string
      brand_id: string
    }) => {
      const { error } = await db()
        .from('instagram_account_insights')
        .upsert(insight, { onConflict: 'insight_date,brand_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-insights'] }),
  })
}

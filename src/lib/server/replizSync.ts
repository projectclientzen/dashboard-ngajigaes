import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSchedule, getContentStatistic } from '@/lib/server/repliz'

// Sync status schedule + engagement dari Repliz ke contents.
// Dipakai oleh /api/repliz/sync (manual) dan /api/cron/repliz-sync (terjadwal).
export async function runReplizSync() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ambil konten yang punya schedule Repliz dan belum final
  const { data: rows, error } = await admin
    .from('contents')
    .select('id, repliz_schedule_id, repliz_status')
    .not('repliz_schedule_id', 'is', null)
    .neq('repliz_status', 'failed')
  if (error) throw new Error(error.message)

  let updated = 0
  const errors: string[] = []

  for (const row of rows ?? []) {
    try {
      const sched = await getSchedule(row.repliz_schedule_id as string)
      const s = (sched.data ?? sched) as Record<string, unknown>
      const status = (s.status as string) ?? null
      const postLink =
        (s.permalink as string) ?? (s.postUrl as string) ?? (s.link as string) ?? null
      const contentId =
        (s.contentId as string) ?? (s.content_id as string) ?? null
      const accountId =
        (s.accountId as string) ?? (s.account_id as string) ?? null

      const update: Record<string, unknown> = {}
      if (status) {
        update.repliz_status = status
        // Terpublish → update status konten dashboard
        if (['published', 'success', 'done', 'sent'].includes(status.toLowerCase())) {
          update.status = 'published'
        }
      }
      if (postLink) update.post_link = postLink

      // Engagement jika sudah published & ada content id + account id di Repliz
      if (contentId && accountId) {
        try {
          const stat = await getContentStatistic(contentId, accountId)
          const d = (stat.data ?? stat) as Record<string, unknown>
          // Metric tersedia beda-beda per platform (TikTok ga punya saved/interaction,
          // Threads ga punya saved, dll) — guard typeof number per field.
          if (typeof d.like === 'number')        update.likes = d.like
          if (typeof d.comment === 'number')     update.comments = d.comment
          if (typeof d.share === 'number')       update.shares = d.share
          if (typeof d.reach === 'number')       update.reach = d.reach
          if (typeof d.saved === 'number')       update.saved = d.saved
          if (typeof d.views === 'number')       update.views = d.views
          if (typeof d.interaction === 'number') update.interaction = d.interaction
          update.engagement_synced_at = new Date().toISOString()
        } catch { /* statistik belum tersedia — skip */ }
      }

      if (Object.keys(update).length > 0) {
        await admin.from('contents').update(update).eq('id', row.id)
        updated++
      }
    } catch (e) {
      errors.push(`${row.id}: ${(e as Error).message}`)
    }
  }

  return { checked: rows?.length ?? 0, updated, errors }
}

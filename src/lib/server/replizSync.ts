import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSchedule, getContentStatistic, getAccountStatistic } from '@/lib/server/repliz'
import { todayJakarta } from '@/lib/utils'

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

// Sync statistik akun IG (agregat) dari Repliz → snapshot harian di
// instagram_account_insights, per brand yang punya `repliz_ig_account_id`.
// Repliz statistik akun bukan harian granular — jadi ini overwrite snapshot
// hari ini (WIB), bukan accumulate.
export async function runReplizAccountInsightSync() {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: brands, error } = await admin
    .from('brands')
    .select('id, repliz_ig_account_id')
    .eq('status', 'active')
    .not('repliz_ig_account_id', 'is', null)
  if (error) throw new Error(error.message)

  const insightDate = todayJakarta()
  let updated = 0
  const errors: string[] = []

  for (const b of brands ?? []) {
    const accountId = b.repliz_ig_account_id as string
    try {
      const stat = await getAccountStatistic(accountId)
      const d = (stat.data ?? stat) as Record<string, unknown>

      // Kolom yang Repliz TIDAK sediakan (followers, impressions,
      // profile_visits, dm_count) sengaja tidak dimasukkan payload —
      // biar tetap bisa diisi manual tanpa ke-overwrite null.
      const row: Record<string, unknown> = { insight_date: insightDate, brand_id: b.id }
      if (typeof d.reach === 'number')    row.reach = d.reach
      if (typeof d.likes === 'number')    row.total_likes = d.likes
      if (typeof d.comments === 'number') row.total_comments = d.comments
      if (typeof d.saves === 'number')    row.total_saves = d.saves
      if (typeof d.shares === 'number')       row.total_shares = d.shares
      else if (typeof d.reposts === 'number') row.total_shares = d.reposts
      if (typeof d.profileLinksTaps === 'number') row.link_clicks = d.profileLinksTaps

      const reach = typeof d.reach === 'number' ? d.reach : 0
      if (typeof d.totalInteractions === 'number' && reach > 0) {
        row.engagement_rate = Number(((d.totalInteractions / reach) * 100).toFixed(2))
      }

      const { error: upErr } = await admin
        .from('instagram_account_insights')
        .upsert(row, { onConflict: 'insight_date,brand_id' })
      if (upErr) throw new Error(upErr.message)
      updated++
    } catch (e) {
      errors.push(`brand ${b.id} (account ${accountId}): ${(e as Error).message}`)
    }
  }

  return { checked: brands?.length ?? 0, updated, errors }
}

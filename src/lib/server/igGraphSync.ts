import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAccountInsights, getRecentMedia, getMediaInsights } from '@/lib/server/igGraph'
import { todayJakarta } from '@/lib/utils'

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Sync snapshot harian instagram_account_insights dari IG Graph API — sumber
// UTAMA untuk brand yang punya `ig_user_id`. Ditulis SETELAH Repliz sync di
// cron yang sama, jadi field yang overlap (reach, engagement dkk.) tertimpa
// oleh nilai IG Graph API (lebih akurat). Kolom manual (followers, dm_count,
// impressions, profile_visits — Repliz/manual) sengaja tidak disentuh di sini
// kecuali yang memang datang dari Graph API (followers_count, profile_views,
// follows/unfollows).
export async function runIgGraphAccountInsightSync() {
  if (!process.env.IG_ACCESS_TOKEN) {
    return { skipped: true, reason: 'IG_ACCESS_TOKEN belum di-set', checked: 0, updated: 0, errors: [] }
  }

  const db = admin()
  const { data: brands, error } = await db
    .from('brands')
    .select('id, ig_user_id')
    .eq('status', 'active')
    .not('ig_user_id', 'is', null)
  if (error) throw new Error(error.message)

  const insightDate = todayJakarta()
  let updated = 0
  const errors: string[] = []

  for (const b of brands ?? []) {
    const igUserId = b.ig_user_id as string
    try {
      const snap = await getAccountInsights(igUserId, insightDate, insightDate)

      const row: Record<string, unknown> = { insight_date: insightDate, brand_id: b.id }
      if (snap.reach != null) row.reach = snap.reach
      if (snap.profileViews != null) row.profile_visits = snap.profileViews
      if (snap.followersCount != null) row.followers = snap.followersCount
      if (snap.followsCount != null) row.follows_count = snap.followsCount
      if (snap.unfollowsCount != null) row.unfollows_count = snap.unfollowsCount

      if (Object.keys(row).length > 2) {
        const { error: upErr } = await db
          .from('instagram_account_insights')
          .upsert(row, { onConflict: 'insight_date,brand_id' })
        if (upErr) throw new Error(upErr.message)
        updated++
      }
    } catch (e) {
      errors.push(`brand ${b.id} (ig_user_id ${igUserId}): ${(e as Error).message}`)
    }
  }

  return { skipped: false, checked: brands?.length ?? 0, updated, errors }
}

// Sync Top Konten (instagram_content_insights) dari media list IG Graph API.
// Dicocokkan ke `contents` lewat post_link (permalink) — kalau tidak ketemu,
// media di-skip (mungkin belum diposting via dashboard ini).
export async function runIgGraphContentInsightSync() {
  if (!process.env.IG_ACCESS_TOKEN) {
    return { skipped: true, reason: 'IG_ACCESS_TOKEN belum di-set', checked: 0, updated: 0, errors: [] }
  }

  const db = admin()
  const { data: brands, error } = await db
    .from('brands')
    .select('id, ig_user_id')
    .eq('status', 'active')
    .not('ig_user_id', 'is', null)
  if (error) throw new Error(error.message)

  const insightDate = todayJakarta()
  let checked = 0
  let updated = 0
  const errors: string[] = []

  for (const b of brands ?? []) {
    const igUserId = b.ig_user_id as string
    try {
      const media = await getRecentMedia(igUserId, 25)
      checked += media.length

      for (const m of media) {
        if (!m.permalink) continue
        try {
          const { data: content } = await db
            .from('contents')
            .select('id')
            .eq('brand_id', b.id)
            .eq('post_link', m.permalink)
            .maybeSingle()
          if (!content) continue

          const stat = await getMediaInsights(m.id, m.mediaType)
          const row: Record<string, unknown> = {
            content_id: content.id, insight_date: insightDate, brand_id: b.id,
          }
          if (stat.reach != null) row.reach = stat.reach
          if (stat.likes != null) row.likes = stat.likes
          if (stat.comments != null) row.comments = stat.comments
          if (stat.saved != null) row.saves = stat.saved
          if (stat.shares != null) row.shares = stat.shares

          const { error: upErr } = await db
            .from('instagram_content_insights')
            .upsert(row, { onConflict: 'content_id,insight_date' })
          if (upErr) throw new Error(upErr.message)
          updated++
        } catch (e) {
          errors.push(`media ${m.id}: ${(e as Error).message}`)
        }
      }
    } catch (e) {
      errors.push(`brand ${b.id} media list: ${(e as Error).message}`)
    }
  }

  return { skipped: false, checked, updated, errors }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSchedule, getContentStatistic } from '@/lib/server/repliz'

// POST — sync status schedule + engagement dari Repliz ke contents
// Dipanggil Netlify scheduled function (harian) atau manual.
// Auth: Bearer PUSH_SEND_SECRET (reuse secret internal yang sudah ada)
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.PUSH_SEND_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

      const update: Record<string, unknown> = {}
      if (status) {
        update.repliz_status = status
        // Terpublish → update status konten dashboard
        if (['published', 'success', 'done', 'sent'].includes(status.toLowerCase())) {
          update.status = 'published'
        }
      }
      if (postLink) update.post_link = postLink

      // Engagement jika sudah published & ada content id di Repliz
      if (contentId) {
        try {
          const stat = await getContentStatistic({ contentId })
          const d = (stat.data ?? stat) as Record<string, unknown>
          if (typeof d.likes === 'number')    update.likes = d.likes
          if (typeof d.comments === 'number') update.comments = d.comments
          if (typeof d.shares === 'number')   update.shares = d.shares
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

  return NextResponse.json({ checked: rows?.length ?? 0, updated, errors })
}

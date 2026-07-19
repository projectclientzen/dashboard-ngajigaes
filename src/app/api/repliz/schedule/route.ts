import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createSchedule, type ReplizPostType, type ReplizMedia } from '@/lib/server/repliz'

// Mapping format konten dashboard → post type Repliz
const FORMAT_TO_TYPE: Record<string, ReplizPostType> = {
  feed_single: 'image',
  carousel: 'album',
  reels: 'video',
  story: 'story',
  ads_creative: 'image',
  live: 'video',
  other: 'image',
}

// POST — jadwalkan konten dashboard ke Repliz
// Body: { content_id: string, account_id: string, media_urls?: string[] }
export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    content_id: string
    account_id: string
    media_urls?: string[]
  }
  if (!body.content_id || !body.account_id) {
    return NextResponse.json({ error: 'content_id dan account_id wajib' }, { status: 400 })
  }

  // Ambil konten (pakai session user → RLS berlaku)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: content, error: cErr } = await (supabase as any)
    .from('contents')
    .select('*')
    .eq('id', body.content_id)
    .single()
  if (cErr || !content) {
    return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 })
  }
  if (!content.publish_date) {
    return NextResponse.json({ error: 'Konten belum punya tanggal publish' }, { status: 400 })
  }

  const type = FORMAT_TO_TYPE[content.format as string] ?? 'image'

  // Media: dari body.media_urls atau fallback asset_link
  const urls = (body.media_urls?.length ? body.media_urls : [content.asset_link]).filter(Boolean) as string[]
  if (urls.length === 0 && type !== 'text') {
    return NextResponse.json({ error: 'Butuh minimal satu media URL (isi Link Asset atau media_urls)' }, { status: 400 })
  }
  const medias: ReplizMedia[] = urls.map(url => ({
    type: type === 'video' || type === 'reel' ? 'video' : 'image',
    url,
  }))

  // scheduleAt: publish_date jam 10.00 WIB default (03.00 UTC) jika tanpa jam
  const dateOnly = (content.publish_date as string).split('T')[0]
  const scheduleAt = content.publish_date.includes('T')
    ? new Date(content.publish_date).toISOString()
    : `${dateOnly}T03:00:00.000Z`

  try {
    const result = await createSchedule({
      title: content.title,
      description: [content.hook, content.caption, content.cta].filter(Boolean).join('\n\n') || content.title,
      type,
      medias,
      accountId: body.account_id,
      scheduleAt,
    })

    // Simpan schedule id ke contents via service role (bypass RLS untuk kolom sync)
    const scheduleId =
      (result.id as string) ??
      (result._id as string) ??
      ((result.data as Record<string, unknown> | undefined)?.id as string) ??
      ((result.data as Record<string, unknown> | undefined)?._id as string) ??
      null

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('contents').update({
      repliz_schedule_id: scheduleId,
      repliz_account_id: body.account_id,
      repliz_status: 'scheduled',
      status: 'scheduled',
    }).eq('id', body.content_id)

    return NextResponse.json({ ok: true, schedule_id: scheduleId, raw: result })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}

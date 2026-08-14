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
// Body: { content_id, account_id, media_urls?: string[], music?: string, schedule_at?: string }
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
    music?: string
    schedule_at?: string // ISO 8601, opsional — override waktu jadwal
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

  // Tolak kalau sudah terjadwal — jangan timpa schedule yang ada
  if (content.repliz_schedule_id) {
    return NextResponse.json({ error: 'Konten ini sudah terjadwal di Repliz.' }, { status: 409 })
  }

  if (!content.publish_date && !body.schedule_at) {
    return NextResponse.json({ error: 'Konten belum punya tanggal publish' }, { status: 400 })
  }

  const type = FORMAT_TO_TYPE[content.format as string] ?? 'image'

  // Media: dari body.media_urls (multi, urutan sesuai input) atau fallback asset_link
  const urls = (body.media_urls?.length ? body.media_urls : [content.asset_link]).filter(Boolean) as string[]
  if (urls.length === 0 && type !== 'text') {
    return NextResponse.json({ error: 'Butuh minimal satu media URL (isi Link Asset atau upload gambar)' }, { status: 400 })
  }
  const medias: ReplizMedia[] = urls.map(url => ({
    type: type === 'video' || type === 'reel' ? 'video' : 'image',
    url,
  }))

  // scheduleAt: pakai override client (tanggal+jam WIB dari UI) kalau ada,
  // fallback ke publish_date jam 10.00 WIB default.
  let scheduleAt: string
  if (body.schedule_at) {
    scheduleAt = new Date(body.schedule_at).toISOString()
  } else {
    const dateOnly = (content.publish_date as string).split('T')[0]
    scheduleAt = content.publish_date.includes('T')
      ? new Date(content.publish_date).toISOString()
      : `${dateOnly}T03:00:00.000Z`
  }

  // Tolak kalau tanggal jadwal sudah lewat
  if (new Date(scheduleAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Tanggal/jam jadwal sudah lewat — pilih waktu di masa depan.' }, { status: 400 })
  }

  try {
    const result = await createSchedule({
      title: content.title,
      description: [content.hook, content.caption, content.cta].filter(Boolean).join('\n\n') || content.title,
      type,
      medias,
      accountId: body.account_id,
      scheduleAt,
      ...(body.music?.trim() ? {
        additionalInfo: { music: { id: '', name: body.music.trim(), artist: '', thumbnail: '' } },
      } : {}),
    })

    // Repliz balikin { scheduleId }. Jaga fallback ke bentuk lama (id/_id)
    // buat kompatibilitas kalau ada versi API yang beda.
    const scheduleId =
      (result.scheduleId as string) ??
      (result.id as string) ??
      (result._id as string) ??
      ((result.data as Record<string, unknown> | undefined)?.id as string) ??
      ((result.data as Record<string, unknown> | undefined)?._id as string) ??
      null

    // Simpan schedule id ke contents via service role (bypass RLS untuk kolom sync)
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

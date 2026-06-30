import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:info.ngajigaes@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function todayJakarta() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

// POST — kirim notifikasi ke user yang belum isi daily report
// Dipanggil oleh Netlify scheduled function atau manual
export async function POST(req: NextRequest) {
  // Verifikasi secret
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.PUSH_SEND_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = adminClient()
  const today = todayJakarta()

  // Ambil semua user aktif
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name')
    .eq('status', 'active')

  // Ambil user yang sudah isi hari ini
  const { data: filled } = await supabase
    .from('daily_reports')
    .select('user_id')
    .eq('report_date', today)

  const filledIds = new Set((filled ?? []).map((r: { user_id: string }) => r.user_id))
  const notFilled = (allUsers ?? []).filter((u: { id: string }) => !filledIds.has(u.id))

  if (notFilled.length === 0) {
    return NextResponse.json({ sent: 0, message: 'Semua sudah mengisi' })
  }

  // Ambil subscriptions untuk user yang belum isi
  const notFilledIds = notFilled.map((u: { id: string }) => u.id)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', notFilledIds)

  let sent = 0
  const failed: string[] = []

  const now = new Date()
  const hour = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
  const isAfternoon = hour >= 12

  const payload = JSON.stringify({
    title: 'NgajiGaes — Daily Report',
    body: isAfternoon
      ? '⚠️ Kamu belum isi daily report hari ini. Yuk isi sekarang!'
      : '📋 Jangan lupa isi daily report hari ini ya!',
    url: '/daily-reports',
  })

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint as string,
          keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
        },
        payload
      )
      sent++
    } catch {
      failed.push(sub.user_id as string)
      // Hapus subscription kadaluarsa
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', sub.endpoint)
    }
  }

  return NextResponse.json({ sent, failed: failed.length, notFilled: notFilled.length })
}

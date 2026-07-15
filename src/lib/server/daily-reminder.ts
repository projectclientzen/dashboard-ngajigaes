import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Modul server-only — dipakai oleh /api/push/send (manual) dan /api/cron/daily-reminder (Vercel Cron)

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function todayJakarta() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export interface ReminderResult {
  sent: number
  failed: number
  notFilled: number
  message?: string
}

export async function sendDailyReminders(): Promise<ReminderResult> {
  webpush.setVapidDetails(
    'mailto:info.ngajigaes@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = adminClient()
  const today = todayJakarta()

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name')
    .eq('status', 'active')

  const { data: filled } = await supabase
    .from('daily_reports')
    .select('user_id')
    .eq('report_date', today)

  const filledIds = new Set((filled ?? []).map((r: { user_id: string }) => r.user_id))
  const notFilled = (allUsers ?? []).filter((u: { id: string }) => !filledIds.has(u.id))

  if (notFilled.length === 0) {
    return { sent: 0, failed: 0, notFilled: 0, message: 'Semua sudah mengisi' }
  }

  const notFilledIds = notFilled.map((u: { id: string }) => u.id)
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', notFilledIds)

  let sent = 0
  const failed: string[] = []

  const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours()
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

  return { sent, failed: failed.length, notFilled: notFilled.length }
}

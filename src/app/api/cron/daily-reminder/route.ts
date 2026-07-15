import { NextRequest, NextResponse } from 'next/server'
import { sendDailyReminders } from '@/lib/server/daily-reminder'

// GET — dipanggil Vercel Cron (lihat vercel.json).
// Vercel otomatis menyertakan header `Authorization: Bearer ${CRON_SECRET}`
// jika env var CRON_SECRET di-set di project.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await sendDailyReminders()
  console.log('[daily-reminder cron]', result)
  return NextResponse.json(result)
}

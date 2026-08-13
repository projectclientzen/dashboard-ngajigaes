import { NextRequest, NextResponse } from 'next/server'
import { runReplizSync } from '@/lib/server/replizSync'

// GET — dipanggil scheduler (Vercel Cron / VPS crontab / dll).
// Auth: Bearer PUSH_SEND_SECRET (sama dengan POST /api/repliz/sync, reuse
// secret internal yang sudah ada — bukan CRON_SECRET terpisah).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.PUSH_SEND_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await runReplizSync()
    console.log('[repliz-sync cron]', result)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { runReplizSync, runReplizAccountInsightSync } from '@/lib/server/replizSync'
import { runIgGraphAccountInsightSync, runIgGraphContentInsightSync } from '@/lib/server/igGraphSync'

// GET — dipanggil scheduler (Vercel Cron / VPS crontab / dll).
// Urutan: Repliz dulu (pelengkap + non-IG), lalu IG Graph API (sumber UTAMA —
// upsert-nya menang untuk kolom yang overlap karena jalan belakangan).
// Auth: Bearer PUSH_SEND_SECRET (sama dengan POST /api/repliz/sync, reuse
// secret internal yang sudah ada — bukan CRON_SECRET terpisah).
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.PUSH_SEND_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [content, insight] = await Promise.all([
      runReplizSync(),
      runReplizAccountInsightSync(),
    ])
    const [igAccount, igContent] = await Promise.all([
      runIgGraphAccountInsightSync(),
      runIgGraphContentInsightSync(),
    ])
    console.log('[repliz-sync cron]', { content, insight, igAccount, igContent })
    return NextResponse.json({ content, insight, igAccount, igContent })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

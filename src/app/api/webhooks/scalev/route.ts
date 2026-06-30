/**
 * /api/webhooks/scalev
 *
 * POST — Terima webhook dari Scalev
 *   1. Baca raw body sebelum parse
 *   2. Verifikasi HMAC-SHA256 signature
 *   3. Dedup: jika scalev_unique_id sudah ada → ignored, return 200
 *   4. Insert ke scalev_webhook_events status pending, return 200 cepat
 *
 * GET  — Health check
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/server/supabaseAdmin'
import { verifyScalevSignature } from '@/lib/server/scalevSignature'

// ── Helpers ─────────────────────────────────────────────────

function getSignature(req: NextRequest): string | null {
  return (
    req.headers.get('x-scalev-signature') ??
    req.headers.get('x-hub-signature-256') ?? // fallback jika Scalev pakai nama ini
    null
  )
}

function extractUniqueId(payload: Record<string, unknown>): string | null {
  // Field akan dikunci setelah payload real WH-11 — pakai kandidat umum dulu
  return (
    (payload.unique_id as string) ??
    (payload.event_id as string) ??
    (payload.id as string) ??
    null
  )
}

function extractEventType(payload: Record<string, unknown>): string {
  return (
    (payload.event as string) ??
    (payload.event_type as string) ??
    (payload.type as string) ??
    'unknown'
  )
}

// ── POST ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // WH-4: guard webhook enabled
  if (process.env.SCALEV_WEBHOOK_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Webhook disabled' }, { status: 503 })
  }

  // WH-7: baca raw body SEBELUM parse JSON
  const rawBody = await req.text()

  // WH-7: verifikasi signature
  const signature = getSignature(req)
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const secret = process.env.SCALEV_SIGNING_SECRET
  if (!secret) {
    console.error('[scalev-webhook] SCALEV_SIGNING_SECRET tidak di-set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const valid = await verifyScalevSignature(rawBody, signature, secret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse payload setelah signature valid
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const scalevUniqueId = extractUniqueId(payload)
  const eventType = extractEventType(payload)

  // WH-9: Dedup — cek apakah unique_id sudah ada
  if (scalevUniqueId) {
    const { data: existing } = await supabaseAdmin
      .from('scalev_webhook_events' as never)
      .select('id, processed_status')
      .eq('scalev_unique_id', scalevUniqueId)
      .maybeSingle()

    if (existing) {
      // Sudah ada → tandai ignored, return 200 (idempoten)
      await supabaseAdmin
        .from('scalev_webhook_events' as never)
        .update({ processed_status: 'ignored' } as never)
        .eq('scalev_unique_id', scalevUniqueId)

      return NextResponse.json({ ok: true, status: 'ignored' })
    }
  }

  // WH-8: simpan raw payload status pending
  const { error: insertError } = await supabaseAdmin
    .from('scalev_webhook_events' as never)
    .insert({
      scalev_unique_id: scalevUniqueId,
      event_type: eventType,
      raw_payload: payload,
      processed_status: 'pending',
      received_at: new Date().toISOString(),
    } as never)

  if (insertError) {
    console.error('[scalev-webhook] Insert error:', insertError.message)
    // Tetap return 200 agar Scalev tidak retry (payload sudah diterima)
    return NextResponse.json({ ok: true, status: 'save_error', detail: insertError.message })
  }

  return NextResponse.json({ ok: true, status: 'pending' })
}

// ── GET — WH-10: Health check ───────────────────────────────

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'scalev-webhook',
    enabled: process.env.SCALEV_WEBHOOK_ENABLED === 'true',
    timestamp: new Date().toISOString(),
  })
}

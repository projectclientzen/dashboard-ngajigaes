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
  // Prioritas: X-Scalev-Hmac-Sha256 (docs resmi Scalev, Base64)
  return (
    req.headers.get('x-scalev-hmac-sha256') ??
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

// Tanggal WIB dari timestamp ISO — samakan dengan konvensi dashboard
// (src/lib/utils.ts:toJakartaDate). draft_time/created_at dari Scalev
// selalu UTC ("...Z"); .slice(0,10) mentah akan salah untuk order
// 00:00–07:00 WIB (masuk ke tanggal kemarin).
function jakartaDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}

// ── POST ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // WH-4: guard webhook enabled
  if (process.env.SCALEV_WEBHOOK_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Webhook disabled' }, { status: 503 })
  }

  // WH-7: baca raw body SEBELUM parse JSON
  const rawBody = await req.text()

  // Parse payload untuk deteksi test event (validasi awal Scalev)
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = extractEventType(payload)

  // business.test_event — dikirim Scalev saat validasi endpoint PERTAMA KALI
  // (tanpa signature, sesuai docs: "return any 2xx, otherwise test fails")
  if (eventType === 'business.test_event') {
    return NextResponse.json({ ok: true, status: 'test_ok', event: eventType })
  }

  // WH-7: verifikasi signature (untuk event real)
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

  const scalevUniqueId = extractUniqueId(payload)

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

  // WH-11: event order — upsert langsung ke scalev_orders (real-time)
  // Payload Scalev: { event, unique_id, timestamp, data: { order_id, status, ... } }
  await upsertOrderFromPayload(payload as Record<string, unknown>)

  return NextResponse.json({ ok: true, status: 'pending' })
}

// ── Real-time order upsert ──────────────────────────────────
const ORDER_EVENTS = ['order.created', 'order.updated', 'order.status_changed', 'order.epayment_created']

async function upsertOrderFromPayload(payload: Record<string, unknown>) {
  const event = payload.event as string | undefined
  const data = (payload.data ?? {}) as Record<string, unknown>
  if (!event || !ORDER_EVENTS.includes(event)) return

  const orderId = data.order_id as string | undefined
  if (!orderId) return

  // Payload Scalev REAL tidak selalu punya gross_revenue (event
  // status_changed/payment hanya kirim status + timestamps).
  // JANGAN timpa nilai existing dengan 0/null — hanya update kolom
  // yang benar-benar ada di payload.
  const status = (data.status as string) ?? undefined
  const gross = data.gross_revenue ?? data.gross ?? data.net_revenue
  const net = data.net_revenue ?? data.net_payment_revenue
  const paymentMethod = (data.payment_method as string) ?? undefined
  // WIB, bukan slice UTC mentah (lihat jakartaDate di atas) — dan SELALU terisi
  // (fallback ke hari ini WIB) supaya order tidak tersaring keluar oleh filter
  // rentang tanggal dashboard gara-gara order_date NULL.
  const rawDate = (data.draft_time ?? data.created_at) as string | undefined
  const orderDate = jakartaDate(rawDate ?? new Date().toISOString())
  const isSpam = data.is_probably_spam

  const row: Record<string, unknown> = {
    order_id: orderId,
    order_date: orderDate,
    synced_at: new Date().toISOString(),
  }
  if (status !== undefined) row.status = status
  if (gross !== undefined && gross !== null) row.gross_revenue = Number(gross)
  if (net !== undefined && net !== null) row.net_payment_revenue = Number(net)
  if (paymentMethod !== undefined) row.payment_method = paymentMethod
  if (isSpam !== undefined) row.is_spam = !!isSpam

  // brand_id: mapping via brands.scalev_store_id (business.unique_id di payload
  // Scalev — lihat migration 20260815_scalev_store_id.sql). Best-effort — kalau
  // kolomnya belum ada/lookup gagal, order tetap ter-upsert tanpa brand_id
  // (sama seperti perilaku sebelumnya), bukan gagal total.
  const business = data.business as Record<string, unknown> | undefined
  const storeId = business?.unique_id as string | undefined
  if (storeId) {
    try {
      const { data: b } = await supabaseAdmin
        .from('brands' as never)
        .select('id')
        .eq('scalev_store_id' as never, storeId)
        .maybeSingle()
      if (b) row.brand_id = (b as { id: string }).id
      else console.error(`[scalev-webhook] tidak ada brand dengan scalev_store_id=${storeId}`)
    } catch (e) {
      console.error('[scalev-webhook] brand lookup error:', (e as Error).message)
    }
  }

  try {
    await supabaseAdmin
      .from('scalev_orders' as never)
      .upsert(row as never, { onConflict: 'order_id' } as never)
    console.log(`[scalev-webhook] upsert order ${orderId} status=${status ?? 'unchanged'}`)
  } catch (e) {
    // Jangan block — polling backup tetap jalan
    console.error('[scalev-webhook] upsert order error:', (e as Error).message)
  }
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

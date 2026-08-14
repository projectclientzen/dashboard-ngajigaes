/**
 * Scalev Webhook Signature Verification — SERVER ONLY
 * HMAC-SHA256, Base64, timing-safe compare.
 *
 * Sesuai docs Scalev (verifying-a-webhook-request):
 * 1. Baca raw body bytes
 * 2. Baca signature dari header X-Scalev-Hmac-Sha256 (Base64)
 * 3. Hitung HMAC-SHA256(raw body, signing secret)
 * 4. Decode Base64 signature yang diterima, bandingkan bytes (timing-safe)
 */

const MAX_BODY_BYTES = 1 * 1024 * 1024 // 1 MB guard

/**
 * Verify HMAC-SHA256 signature dari Scalev webhook.
 * @param rawBody   Raw request body (string)
 * @param signature Header X-Scalev-Hmac-Sha256 (Base64) — juga terima hex "sha256=<hex>"
 * @param secret    Signing secret dari env
 * @returns true jika valid
 */
export async function verifyScalevSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Guard panjang body
  if (rawBody.length > MAX_BODY_BYTES) return false
  if (!signature || signature.length === 0) return false

  const encoder = new TextEncoder()

  // Hitung HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const expected = new Uint8Array(mac)

  let received: Uint8Array | null = null

  // Format 1: Base64 (dokumen resmi Scalev)
  try {
    const bin = atob(signature.trim())
    received = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    received = null
  }

  // Format 2: hex dengan prefix "sha256=" (fallback, gaya GitHub/Stripe)
  if (!received || received.length === 0) {
    const hexSig = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature
    if (hexSig && /^[0-9a-fA-F]+$/.test(hexSig) && hexSig.length % 2 === 0) {
      received = new Uint8Array(
        hexSig.match(/.{2}/g)!.map((b) => parseInt(b, 16))
      )
    }
  }

  if (!received) return false

  // Timing-safe compare — panjang harus sama dulu
  if (received.length !== expected.length) return false

  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= received[i] ^ expected[i]
  }
  return diff === 0
}

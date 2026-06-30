/**
 * Scalev Webhook Signature Verification — SERVER ONLY
 * HMAC-SHA256, timing-safe compare.
 */

const MAX_BODY_BYTES = 1 * 1024 * 1024 // 1 MB guard

/**
 * Verify HMAC-SHA256 signature dari Scalev webhook.
 * @param rawBody   Raw request body (string)
 * @param signature Header X-Scalev-Signature (hex atau "sha256=<hex>")
 * @param secret    SCALEV_SIGNING_SECRET dari env
 * @returns true jika valid
 */
export async function verifyScalevSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Guard panjang body
  if (rawBody.length > MAX_BODY_BYTES) return false

  // Normalise: buang prefix "sha256=" jika ada
  const hexSig = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature

  if (!hexSig || hexSig.length === 0) return false

  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))

  // Hex-encode hasil MAC
  const expectedHex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe compare — panjang harus sama dulu
  if (expectedHex.length !== hexSig.length) return false

  const a = encoder.encode(expectedHex)
  const b = encoder.encode(hexSig)

  // Timing-safe: manual XOR, constant-time per character
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

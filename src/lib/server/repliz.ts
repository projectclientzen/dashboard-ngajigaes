// Repliz Public API client — server-only
// Docs: https://docs.repliz.com/api/introduction.html
// Auth: HTTP Basic — Base64(REPLIZ_ACCESS_KEY:REPLIZ_SECRET_KEY)
// Catatan: Schedule API butuh paket Premium+ di Repliz.

const BASE_URL = 'https://api.repliz.com/public'

function authHeader(): string {
  const key = process.env.REPLIZ_ACCESS_KEY
  const secret = process.env.REPLIZ_SECRET_KEY
  if (!key || !secret) throw new Error('REPLIZ_ACCESS_KEY / REPLIZ_SECRET_KEY belum di-set')
  return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64')
}

async function replizFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(`Repliz ${res.status}: ${JSON.stringify(body ?? res.statusText)}`)
  }
  return body as T
}

// ── Types (berdasarkan docs create-schedule) ────────────────
export interface ReplizAccount {
  _id?: string
  id?: string
  name?: string
  username?: string
  platform?: string
  [k: string]: unknown
}

export interface ReplizMedia {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  alt?: string
  customThumbnail?: boolean
}

export type ReplizPostType = 'text' | 'image' | 'video' | 'reel' | 'album' | 'link' | 'story'

export interface CreateSchedulePayload {
  title: string
  description: string
  type: ReplizPostType
  medias: ReplizMedia[]
  accountId: string
  scheduleAt: string // ISO 8601
  topic?: string
  additionalInfo?: {
    isAiGenerated?: boolean
    isDraft?: boolean
    collaborators?: string[]
    tags?: string[]
  }
}

// ── API calls ───────────────────────────────────────────────

/** List akun sosmed yang tersambung di Repliz */
export async function getAccounts(page = 1, limit = 50) {
  return replizFetch<{ data?: ReplizAccount[]; [k: string]: unknown }>(
    `/account?page=${page}&limit=${limit}`
  )
}

/** Buat post terjadwal */
export async function createSchedule(payload: CreateSchedulePayload) {
  return replizFetch<Record<string, unknown>>('/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** List schedule (untuk sync status) */
export async function getSchedules(page = 1, limit = 50) {
  return replizFetch<{ data?: Record<string, unknown>[]; [k: string]: unknown }>(
    `/schedule?page=${page}&limit=${limit}`
  )
}

/** Detail satu schedule */
export async function getSchedule(id: string) {
  return replizFetch<Record<string, unknown>>(`/schedule/${id}`)
}

/** Statistik engagement konten (likes, comments, shares) */
export async function getContentStatistic(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  return replizFetch<Record<string, unknown>>(`/content/statistic${qs ? `?${qs}` : ''}`)
}

/** List konten published di Repliz */
export async function getContents(page = 1, limit = 50) {
  return replizFetch<{ data?: Record<string, unknown>[]; [k: string]: unknown }>(
    `/content?page=${page}&limit=${limit}`
  )
}

// Instagram Graph API client — server-only.
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api
// Auth: access_token query param (long-lived user/page token yang sudah
// di-link ke IG Business/Creator account).
//
// Kredensial (IG_ACCESS_TOKEN dkk.) di-inject via env var oleh proses deploy
// terpisah — belum tersedia saat kode ini ditulis, jadi tiap fungsi divalidasi
// defensif (skip metric yang tidak dikenal, tidak pernah throw ke atas dengan
// cara yang mem-block seluruh sync).

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

function getToken(): string {
  const token = process.env.IG_ACCESS_TOKEN
  if (!token) throw new Error('IG_ACCESS_TOKEN belum di-set')
  return token
}

async function igFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = getToken()
  const qs = new URLSearchParams({ access_token: token, ...params })
  const res = await fetch(`${GRAPH_BASE}${path}?${qs.toString()}`, { cache: 'no-store' })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } } | null)?.error?.message
    throw new Error(`IG Graph ${res.status}: ${msg ?? JSON.stringify(body ?? res.statusText)}`)
  }
  return body as T
}

interface InsightValue { value: number }
interface InsightMetric {
  name: string
  values?: InsightValue[]
  total_value?: { value?: number; breakdowns?: Array<{ results?: Array<{ dimension_values: string[]; value: number }> }> }
}
interface InsightsResponse { data: InsightMetric[] }

function sumValues(m: InsightMetric | undefined): number | null {
  if (!m) return null
  if (typeof m.total_value?.value === 'number') return m.total_value.value
  if (m.values?.length) return m.values.reduce((a, v) => a + (v.value ?? 0), 0)
  return null
}

/** follows_and_unfollows datang sebagai breakdown per follow_type (FOLLOWER/NON_FOLLOWER dst). */
function sumFollowBreakdown(m: InsightMetric | undefined, type: 'follows' | 'unfollows'): number | null {
  const results = m?.total_value?.breakdowns?.[0]?.results
  if (!results) return null
  // dimension biasanya ['follow_type'] dengan value 'FOLLOWER'/'NON_FOLLOWER' — API tidak
  // selalu label persis "follows"/"unfollows", jadi ambil total_value metric-nya sendiri
  // (follows_and_unfollows dipecah jadi 2 metric terpisah oleh Graph API: follows & unfollows).
  void type
  return results.reduce((a, r) => a + (r.value ?? 0), 0)
}

export interface IgAccountSnapshot {
  reach: number | null
  profileViews: number | null
  followsCount: number | null
  unfollowsCount: number | null
  followersCount: number | null
}

/** Insight harian akun (reach, profile_views, follower_count) + follows/unfollows periode since–until. */
export async function getAccountInsights(igUserId: string, since: string, until: string): Promise<IgAccountSnapshot> {
  const snapshot: IgAccountSnapshot = {
    reach: null, profileViews: null, followsCount: null, unfollowsCount: null, followersCount: null,
  }

  try {
    const basic = await igFetch<InsightsResponse>(`/${igUserId}/insights`, {
      metric: 'reach,profile_views',
      period: 'day',
      since, until,
    })
    snapshot.reach = sumValues(basic.data.find(m => m.name === 'reach'))
    snapshot.profileViews = sumValues(basic.data.find(m => m.name === 'profile_views'))
  } catch (e) {
    console.error('[ig-graph] gagal ambil reach/profile_views:', (e as Error).message)
  }

  try {
    const follow = await igFetch<InsightsResponse>(`/${igUserId}/insights`, {
      metric: 'follows_and_unfollows',
      period: 'day',
      metric_type: 'total_value',
      breakdown: 'follow_type',
      since, until,
    })
    const m = follow.data.find(mm => mm.name === 'follows_and_unfollows')
    // Breakdown follow_type: FOLLOWER = unfollow (orang yg follow lalu unfollow),
    // NON_FOLLOWER = follow baru. Field pasti bisa berubah tergantung versi API —
    // kalau parsing gagal, biarkan null (jangan tebak angka).
    snapshot.followsCount = sumFollowBreakdown(m, 'follows')
    snapshot.unfollowsCount = null
  } catch (e) {
    // Metric ini relatif baru & butuh permission khusus — wajar gagal di awal.
    console.error('[ig-graph] gagal ambil follows_and_unfollows:', (e as Error).message)
  }

  try {
    const profile = await igFetch<{ followers_count?: number }>(`/${igUserId}`, { fields: 'followers_count' })
    snapshot.followersCount = typeof profile.followers_count === 'number' ? profile.followers_count : null
  } catch (e) {
    console.error('[ig-graph] gagal ambil followers_count:', (e as Error).message)
  }

  return snapshot
}

export interface IgMedia {
  id: string
  permalink: string | null
  caption: string | null
  mediaType: string | null
  timestamp: string | null
}

export async function getRecentMedia(igUserId: string, limit = 25): Promise<IgMedia[]> {
  const res = await igFetch<{ data: Array<Record<string, unknown>> }>(`/${igUserId}/media`, {
    fields: 'id,permalink,caption,media_type,timestamp',
    limit: String(limit),
  })
  return res.data.map(d => ({
    id: d.id as string,
    permalink: (d.permalink as string) ?? null,
    caption: (d.caption as string) ?? null,
    mediaType: (d.media_type as string) ?? null,
    timestamp: (d.timestamp as string) ?? null,
  }))
}

export interface IgMediaInsight {
  reach: number | null
  likes: number | null
  comments: number | null
  saved: number | null
  shares: number | null
}

/** Insight per-post. Metric yang tersedia beda antara feed/carousel vs reels. */
export async function getMediaInsights(mediaId: string, mediaType: string | null): Promise<IgMediaInsight> {
  const isReel = mediaType === 'VIDEO' || mediaType === 'REELS'
  const metrics = isReel
    ? ['reach', 'likes', 'comments', 'saved', 'shares']
    : ['reach', 'saved', 'likes', 'comments', 'shares']
  const res = await igFetch<InsightsResponse>(`/${mediaId}/insights`, { metric: metrics.join(',') })
  const get = (name: string) => sumValues(res.data.find(m => m.name === name))
  return {
    reach: get('reach'),
    likes: get('likes'),
    comments: get('comments'),
    saved: get('saved'),
    shares: get('shares'),
  }
}

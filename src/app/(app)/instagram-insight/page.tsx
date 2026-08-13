'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '@/contexts/AppContext'
import { useAccountInsights, useUpsertAccountInsight, useContentInsights } from '@/lib/queries/instagram'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'
import type { ContentFormat } from '@/types'

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

function daysAgoISO(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function erColor(er: number) {
  if (er >= 0.03) return '#5E8C61'
  if (er >= 0.01) return '#C9A227'
  return '#C77B3C'
}

// ─── Badges ───────────────────────────────────────────────────
function SourceBadge({ source }: { source: 'manual' | 'auto' }) {
  return source === 'manual' ? (
    <span className="text-[9.5px] font-semibold text-[#9A6E4A] bg-[#F3E7D8] border border-[#E6D3BE] rounded-[5px] px-[6px] py-[2px]">manual</span>
  ) : (
    <span className="text-[9.5px] font-semibold text-[#3C648F] bg-[#EAF0FA] border border-[#D4E1F0] rounded-[5px] px-[6px] py-[2px]">Auto Repliz</span>
  )
}

const FORMAT_BADGE: Record<string, { label: string; bg: string; c: string }> = {
  feed_single: { label: 'Feed', bg: '#EAF0FA', c: '#3C648F' },
  reels:       { label: 'Reels', bg: '#F3E4EE', c: '#8A4E76' },
  carousel:    { label: 'Carousel', bg: '#EDECD6', c: '#7A7220' },
}
function FormatBadge({ format }: { format: string | null }) {
  if (!format) return null
  const m = FORMAT_BADGE[format] ?? { label: format, bg: '#F1ECDC', c: '#5A574C' }
  return <span className="text-[10px] font-semibold rounded-[5px] px-[7px] py-[2px]" style={{ background: m.bg, color: m.c }}>{m.label}</span>
}
function ThemeBadge({ theme }: { theme: string | null }) {
  if (!theme) return null
  return <span className="text-[10px] font-semibold text-[#5A574C] bg-[#F1ECDC] border border-[#E7E0CC] rounded-[5px] px-[7px] py-[2px]">{theme}</span>
}

// ─── KPI card ─────────────────────────────────────────────────
function MetricCard({ label, value, sub, color, source, action }: {
  label: string; value: string; sub?: string; color?: string; source?: 'manual' | 'auto'; action?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-[6px]">
          <span className="text-[11px] text-[#9A9279] font-medium">{label}</span>
          {source && <SourceBadge source={source} />}
        </div>
        {action}
      </div>
      <div className="text-[20px] font-bold text-[#2B2A24]" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-[11px] text-[#A89F86] mt-[3px]">{sub}</div>}
    </div>
  )
}

function compactNumber(v: number) {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

interface ChartPoint { date: string; value: number }

function ChartTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean; label?: string
  payload?: { value: number }[]
  valueFormatter: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E3DCC8] rounded-md px-[10px] py-[6px] shadow-md">
      <div className="text-[10px] text-[#9A9279] mb-[2px]">{label}</div>
      <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{valueFormatter(payload[0].value)}</div>
    </div>
  )
}

// Mini line chart dengan sumbu Y (nilai asli, bukan garis polos) + tooltip hover.
function MiniLineChart({ data, stroke = '#5E7A5C', axisFormatter, tooltipFormatter }: {
  data: ChartPoint[]; stroke?: string
  axisFormatter: (v: number) => string
  tooltipFormatter: (v: number) => string
}) {
  if (data.length < 2) return <div className="h-[150px] flex items-center justify-center text-[11px] text-[#A89F86]">Belum cukup data</div>
  const values = data.map(d => d.value)
  const min = Math.min(...values), max = Math.max(...values)
  const pad = (max - min) * 0.15 || Math.max(max * 0.1, 1)

  return (
    <div className="h-[150px] -ml-[6px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#F1ECDC" />
          <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
            interval="preserveStartEnd" tickMargin={6} />
          <YAxis width={38} tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
            domain={[Math.max(0, min - pad), max + pad]} tickCount={4} tickFormatter={axisFormatter} />
          <Tooltip content={<ChartTooltip valueFormatter={tooltipFormatter} />} cursor={{ stroke: '#E3DCC8', strokeWidth: 1 }} />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2}
            dot={{ r: 2.5, fill: stroke, strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Top Konten ───────────────────────────────────────────────
const FORMAT_FILTERS: { value: 'all' | ContentFormat; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'feed_single', label: 'Feed' },
  { value: 'reels', label: 'Reels' },
  { value: 'carousel', label: 'Carousel' },
]
const SORT_OPTIONS: { value: 'reach' | 'likes' | 'engagement'; label: string }[] = [
  { value: 'reach', label: 'Reach' },
  { value: 'likes', label: 'Likes' },
  { value: 'engagement', label: 'Engagement' },
]

function TopKontenCard({ brandId, contentFormatFilter }: { brandId: string | 'all'; contentFormatFilter: 'all' | ContentFormat }) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [sortBy, setSortBy] = useState<'reach' | 'likes' | 'engagement'>('reach')
  const [topic, setTopic] = useState('all')

  const start = period === 'week' ? daysAgoISO(7) : daysAgoISO(30)
  const q = useContentInsights(start, daysAgoISO(0), brandId)
  const raw = useMemo(() => q.data ?? [], [q.data])

  const topics = useMemo(() => Array.from(new Set(raw.map(c => c.content_theme).filter((t): t is string => !!t))), [raw])

  const filtered = useMemo(() => {
    let list = raw
    if (contentFormatFilter !== 'all') list = list.filter(c => c.content_format === contentFormatFilter)
    if (topic !== 'all') list = list.filter(c => c.content_theme === topic)
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'reach') return (b.reach ?? 0) - (a.reach ?? 0)
      if (sortBy === 'likes') return (b.likes ?? 0) - (a.likes ?? 0)
      return (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0)
    })
    return sorted.slice(0, 5)
  }, [raw, contentFormatFilter, topic, sortBy])

  const segBtn = (active: boolean) =>
    `px-[12px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`
  const topicBtn = (active: boolean) =>
    `px-[11px] py-[4px] rounded-full text-[11px] font-semibold cursor-pointer border transition-all ${active ? 'bg-[#5E7A5C] text-white border-[#5E7A5C]' : 'bg-white text-[#6B6553] border-[#E3DCC8]'}`

  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="text-[13px] font-bold text-[#2B2A24]">Top Konten</div>
        <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
          <button className={segBtn(period === 'week')} onClick={() => setPeriod('week')}>Mingguan</button>
          <button className={segBtn(period === 'month')} onClick={() => setPeriod('month')}>Bulanan</button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] text-[#9A9279]">Urut</span>
          <select className="border border-[#E3DCC8] rounded-md px-[10px] py-[6px] text-[12px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none"
            value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {topics.length > 0 && (
          <div className="flex items-center gap-[6px] flex-wrap">
            <button className={topicBtn(topic === 'all')} onClick={() => setTopic('all')}>Semua</button>
            {topics.map(t => (
              <button key={t} className={topicBtn(topic === t)} onClick={() => setTopic(t)}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {q.isLoading ? (
        <div className="p-8 text-center text-[13px] text-[#9A9279]">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 flex flex-col items-center text-center gap-2">
          <div className="w-[44px] h-[44px] rounded-lg bg-[#F1ECDC] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A89F86" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
          <div className="text-[14px] font-bold text-[#2B2A24]">Belum ada data konten</div>
          <div className="text-[12px] text-[#9A9279] max-w-[320px]">
            Data performa per konten (<code className="text-[#7A766B]">instagram_content_insights</code>) belum tersedia. Ranking konten terbaik akan muncul setelah data konten pertama masuk.
          </div>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filtered.map((c, i) => (
              <div key={c.id} className="border border-[#F1ECDC] rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-[12px] font-bold text-[#B0A78C] flex-shrink-0 w-[16px]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#2B2A24] text-[13px] truncate">{c.content_title}</div>
                    <div className="flex items-center gap-[5px] mt-[4px]">
                      <FormatBadge format={c.content_format} />
                      <ThemeBadge theme={c.content_theme} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-[10px] text-center">
                  {[
                    ['Reach', c.reach], ['Likes', c.likes], ['Komen', c.comments], ['Saves', c.saves],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="text-[12px] font-bold text-[#2B2A24] tabular-nums">{val != null ? formatNumber(val as number) : '—'}</div>
                      <div className="text-[9px] text-[#A89F86]">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] font-semibold text-right mt-[6px]" style={{ color: c.engagement_rate != null ? erColor(c.engagement_rate / 100) : '#9A9279' }}>
                  ER {c.engagement_rate != null ? `${c.engagement_rate.toFixed(1)}%` : '—'}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#F1ECDC]">
                  {['#', 'KONTEN', 'REACH', 'LIKES', 'KOMEN', 'SAVES', 'ER'].map(h => (
                    <th key={h} className="p-[8px_10px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                    <td className="p-[8px_10px] font-bold text-[#B0A78C]">{i + 1}</td>
                    <td className="p-[8px_10px]">
                      <div className="font-semibold text-[#2B2A24] max-w-[220px] truncate">{c.content_title}</div>
                      <div className="flex items-center gap-[5px] mt-[3px]">
                        <FormatBadge format={c.content_format} />
                        <ThemeBadge theme={c.content_theme} />
                      </div>
                    </td>
                    <td className="p-[8px_10px] tabular-nums text-[#5A574C]">{c.reach != null ? formatNumber(c.reach) : '—'}</td>
                    <td className="p-[8px_10px] tabular-nums text-[#5A574C]">{c.likes != null ? formatNumber(c.likes) : '—'}</td>
                    <td className="p-[8px_10px] tabular-nums text-[#5A574C]">{c.comments != null ? formatNumber(c.comments) : '—'}</td>
                    <td className="p-[8px_10px] tabular-nums text-[#5A574C]">{c.saves != null ? formatNumber(c.saves) : '—'}</td>
                    <td className="p-[8px_10px] tabular-nums font-semibold" style={{ color: c.engagement_rate != null ? erColor(c.engagement_rate / 100) : '#9A9279' }}>
                      {c.engagement_rate != null ? `${c.engagement_rate.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────
export default function InstagramInsightPage() {
  const { rangeStart, rangeEnd, brandId, isAllBrands, requireBrandId } = useApp()
  const insightsQ = useAccountInsights(rangeStart, rangeEnd, brandId)
  const growthQ = useAccountInsights(daysAgoISO(30), daysAgoISO(0), brandId)
  const upsert = useUpsertAccountInsight()

  const [contentFormatFilter, setContentFormatFilter] = useState<'all' | ContentFormat>('all')
  const [showForm, setShowForm] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [form, setForm] = useState({
    insight_date: new Date().toISOString().split('T')[0],
    followers: '', reach: '', impressions: '', profile_visits: '',
    link_clicks: '', dm_count: '', total_likes: '', total_comments: '',
    total_saves: '', total_shares: '', notes: '',
  })
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const insights = insightsQ.data ?? []
  const latest = insights[insights.length - 1]
  const prev = insights[insights.length - 2]

  const growth = (latest?.followers ?? 0) - (prev?.followers ?? 0)
  const avgReach = insights.length
    ? Math.round(insights.reduce((a, i) => a + (i.reach ?? 0), 0) / insights.length)
    : 0
  const erList = insights.filter(i => i.engagement_rate != null)
  const avgEr = erList.length
    ? erList.reduce((a, i) => a + (i.engagement_rate ?? 0), 0) / erList.length
    : null

  // Growth Follower widget — dedicated 30 hari window, terlepas dari filter periode halaman
  const growthRows = [...(growthQ.data ?? [])]
    .filter(r => r.followers != null)
    .sort((a, b) => a.insight_date.localeCompare(b.insight_date))
  const currFollower = growthRows[growthRows.length - 1] ?? null
  function followerDeltaAt(daysBack: number) {
    if (!currFollower) return null
    const boundary = daysAgoISO(daysBack)
    const candidates = growthRows.filter(r => r.insight_date <= boundary)
    const ref = candidates[candidates.length - 1]
    return ref ? (currFollower.followers as number) - (ref.followers as number) : null
  }
  const delta7 = followerDeltaAt(7)
  const delta30 = followerDeltaAt(30)

  // Riwayat Insight — delta harian + highlight terbaik
  const rows = insights.map((ins, i) => {
    const prevRow = insights[i - 1]
    const reachDelta = prevRow?.reach != null && ins.reach != null ? ins.reach - prevRow.reach : null
    const erDelta = prevRow?.engagement_rate != null && ins.engagement_rate != null ? (ins.engagement_rate - prevRow.engagement_rate) * 100 : null
    return { ...ins, reachDelta, erDelta }
  })
  const bestReach = rows.length ? Math.max(...rows.map(r => r.reach ?? -1)) : null

  function openForm(prefillDate?: string) {
    const existing = prefillDate ? insights.find(i => i.insight_date === prefillDate) : undefined
    setForm({
      insight_date: prefillDate ?? new Date().toISOString().split('T')[0],
      followers: existing?.followers != null ? String(existing.followers) : '',
      reach: existing?.reach != null ? String(existing.reach) : '',
      impressions: existing?.impressions != null ? String(existing.impressions) : '',
      profile_visits: existing?.profile_visits != null ? String(existing.profile_visits) : '',
      link_clicks: existing?.link_clicks != null ? String(existing.link_clicks) : '',
      dm_count: existing?.dm_count != null ? String(existing.dm_count) : '',
      total_likes: existing?.total_likes != null ? String(existing.total_likes) : '',
      total_comments: existing?.total_comments != null ? String(existing.total_comments) : '',
      total_saves: existing?.total_saves != null ? String(existing.total_saves) : '',
      total_shares: existing?.total_shares != null ? String(existing.total_shares) : '',
      notes: existing?.notes ?? '',
    })
    setErr('')
    setShowForm(true)
  }

  function numField(key: string) {
    return (
      <input className={inputCls} type="number" min="0" placeholder="0"
        value={(form as Record<string, string>)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
    )
  }

  async function handleSave() {
    setErr('')
    const bId = requireBrandId()
    if (!bId) { setErr('Pilih brand dulu (bukan "Semua Brand") untuk input insight.'); return }
    if (!form.insight_date) { setErr('Tanggal wajib diisi.'); return }
    const num = (v: string) => v ? parseInt(v) : undefined
    try {
      await upsert.mutateAsync({
        insight_date: form.insight_date,
        brand_id: bId,
        followers: num(form.followers),
        reach: num(form.reach),
        impressions: num(form.impressions),
        profile_visits: num(form.profile_visits),
        link_clicks: num(form.link_clicks),
        dm_count: num(form.dm_count),
        total_likes: num(form.total_likes),
        total_comments: num(form.total_comments),
        total_saves: num(form.total_saves),
        total_shares: num(form.total_shares),
        notes: form.notes || undefined,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      setShowForm(false)
    } catch (e) { setErr((e as Error).message) }
  }

  const inputBtnCls = 'text-[11px] font-semibold text-[#4F7CAC] bg-white border border-[#D4E1F0] rounded-md px-[10px] py-[5px] cursor-pointer hover:bg-[#EAF0FA] transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Format — memfilter Top Konten & topik */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] font-semibold text-[#5A574C]">Format</span>
        {FORMAT_FILTERS.map(f => (
          <button key={f.value}
            onClick={() => setContentFormatFilter(f.value)}
            className={`px-[13px] py-[6px] rounded-md text-[12px] font-semibold border-none cursor-pointer transition-all ${contentFormatFilter === f.value ? 'bg-[#5E7A5C] text-white' : 'bg-[#EFEAD9] text-[#5A574C]'}`}>
            {f.label}
          </button>
        ))}
        <span className="text-[11px] text-[#A89F86]">memfilter Top Konten &amp; topik</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Followers" value={latest?.followers != null ? formatNumber(latest.followers) : '—'}
          sub={growth !== 0 ? `${growth > 0 ? '+' : ''}${growth} dari sebelumnya` : 'Belum ada perubahan'}
          color={growth > 0 ? '#5E8C61' : growth < 0 ? '#B4452F' : undefined}
          source="manual"
          action={<button onClick={() => openForm()} className="text-[#9A9279] hover:text-[#5E7A5C] border-none bg-none cursor-pointer" title="Input followers">✎</button>}/>
        <MetricCard label="Avg Reach" value={avgReach > 0 ? formatNumber(avgReach) : '—'}
          sub={`${insights.length} hari data`} source="auto"/>
        <MetricCard label="Engagement Rate" value={avgEr != null ? `${avgEr.toFixed(2)}%` : '—'}
          sub="rata-rata periode ini"
          color={avgEr != null ? erColor(avgEr / 100) : undefined} source="auto"/>
        <MetricCard label="DM Masuk" value={latest?.dm_count != null ? formatNumber(latest.dm_count) : '—'}
          sub="hari terakhir" source="manual"/>
      </div>

      {/* Growth Follower */}
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[13px] font-bold text-[#2B2A24]">Growth Follower</div>
        </div>
        <div className="text-[11px] text-[#9A9279] mb-3">data manual / Meta API</div>
        {!currFollower ? (
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <div className="w-[40px] h-[40px] rounded-lg bg-[#F1ECDC] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A89F86" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="text-[14px] font-bold text-[#2B2A24]">Butuh data manual</div>
            <div className="text-[12px] text-[#9A9279] max-w-[280px]">Repliz tidak menyediakan follower growth. Isi manual saat rekap.</div>
            <button onClick={() => openForm()}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-[16px] py-[9px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors mt-1">
              + Input follower
            </button>
          </div>
        ) : (
          <>
            <div className="text-[26px] font-bold text-[#2B2A24] tabular-nums">{formatNumber(currFollower.followers as number)}</div>
            <div className="text-[11px] text-[#A89F86] mb-3">followers saat ini</div>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-[#F3F6F0] rounded-lg p-3 flex items-center justify-between sm:block">
                <div className="text-[11px] text-[#8A8675] sm:mb-1">Delta 7 hari</div>
                {delta7 != null ? (
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: delta7 >= 0 ? '#4E7A4C' : '#B4452F' }}>
                    {delta7 >= 0 ? '▲' : '▼'} {delta7 >= 0 ? '+' : ''}{formatNumber(delta7)}
                  </div>
                ) : <div className="text-[13px] text-[#A89F86]">—</div>}
              </div>
              <div className="bg-[#F3F6F0] rounded-lg p-3 flex items-center justify-between sm:block">
                <div className="text-[11px] text-[#8A8675] sm:mb-1">Delta 30 hari</div>
                {delta30 != null ? (
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: delta30 >= 0 ? '#4E7A4C' : '#B4452F' }}>
                    {delta30 >= 0 ? '▲' : '▼'} {delta30 >= 0 ? '+' : ''}{formatNumber(delta30)}
                  </div>
                ) : <div className="text-[13px] text-[#A89F86]">—</div>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reach / Engagement per hari */}
      {insights.length > 1 && (() => {
        const reachData: ChartPoint[] = insights.map(i => ({ date: formatDate(i.insight_date, 'd MMM'), value: i.reach ?? 0 }))
        const erData: ChartPoint[] = insights.map(i => ({ date: formatDate(i.insight_date, 'd MMM'), value: i.engagement_rate ?? 0 }))
        const lastReach = reachData[reachData.length - 1]
        const lastEr = erData[erData.length - 1]
        return (
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-bold text-[#2B2A24]">Reach per hari</span>
                <span className="text-[16px] font-bold text-[#2B2A24] tabular-nums">{formatNumber(lastReach.value)}</span>
              </div>
              <div className="text-[11px] text-[#9A9279] mb-1">akun unik terjangkau · {lastReach.date}</div>
              <MiniLineChart data={reachData} stroke="#5E7A5C" axisFormatter={compactNumber} tooltipFormatter={formatNumber} />
            </div>
            <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-bold text-[#2B2A24]">Engagement per hari</span>
                <span className="text-[16px] font-bold tabular-nums" style={{ color: erColor(lastEr.value / 100) }}>{lastEr.value.toFixed(2)}%</span>
              </div>
              <div className="text-[11px] text-[#9A9279] mb-1">engagement rate · {lastEr.date}</div>
              <MiniLineChart data={erData} stroke="#4F7CAC" axisFormatter={v => `${v.toFixed(1)}%`} tooltipFormatter={v => `${v.toFixed(2)}%`} />
            </div>
          </div>
        )
      })()}

      {/* Top Konten */}
      <TopKontenCard brandId={brandId} contentFormatFilter={contentFormatFilter} />

      {/* Riwayat Insight */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#2B2A24]">Riwayat Insight ({insights.length} hari)</h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[12px] text-[#5E8C61] font-semibold">✓ Tersimpan</span>}
          <button onClick={() => openForm()} disabled={isAllBrands}
            title={isAllBrands ? 'Pilih brand dulu untuk input insight' : undefined}
            className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-40 disabled:cursor-not-allowed">
            + Input Insight
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        {insightsQ.isLoading ? (
          <div className="p-6 text-[13px] text-[#9A9279]">Memuat...</div>
        ) : insights.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[15px] font-bold text-[#2B2A24] mb-1">Belum ada insight</div>
            <div className="text-[13px] text-[#9A9279]">Klik &quot;+ Input Insight&quot; untuk memasukkan data harian.</div>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="flex flex-col gap-2 p-3 sm:hidden">
              {[...rows].reverse().map(ins => {
                const isBest = bestReach != null && ins.reach === bestReach
                return (
                  <div key={ins.id} className="border border-[#F1ECDC] rounded-lg p-3" style={isBest ? { background: '#F3F6F0' } : undefined}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-[#2B2A24] text-[13px]">{formatDate(ins.insight_date, 'd MMM yyyy')}</span>
                      {isBest && <span className="text-[9px] font-bold text-[#3C5A3B] bg-[#DCE7D6] rounded px-[6px] py-[1px]">terbaik</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                      <div>
                        <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{ins.reach != null ? formatNumber(ins.reach) : '—'}</div>
                        <div className="text-[9px] text-[#A89F86]">Reach</div>
                        {ins.reachDelta != null && ins.reachDelta !== 0 && (
                          <div className="text-[9px] font-semibold" style={{ color: ins.reachDelta >= 0 ? '#4E7A4C' : '#B4452F' }}>
                            {ins.reachDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(ins.reachDelta))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{ins.total_likes != null ? formatNumber(ins.total_likes) : '—'}</div>
                        <div className="text-[9px] text-[#A89F86]">Likes</div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{ins.total_comments != null ? formatNumber(ins.total_comments) : '—'}</div>
                        <div className="text-[9px] text-[#A89F86]">Komen</div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{ins.total_saves != null ? formatNumber(ins.total_saves) : '—'}</div>
                        <div className="text-[9px] text-[#A89F86]">Saves</div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#2B2A24] tabular-nums">{ins.total_shares != null ? formatNumber(ins.total_shares) : '—'}</div>
                        <div className="text-[9px] text-[#A89F86]">Shares</div>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold tabular-nums" style={{ color: ins.engagement_rate != null ? erColor(ins.engagement_rate / 100) : '#9A9279' }}>
                          {ins.engagement_rate != null ? `${ins.engagement_rate.toFixed(1)}%` : '—'}
                        </div>
                        <div className="text-[9px] text-[#A89F86]">ER</div>
                        {ins.erDelta != null && Math.abs(ins.erDelta) >= 0.01 && (
                          <div className="text-[9px] font-semibold" style={{ color: ins.erDelta >= 0 ? '#4E7A4C' : '#B4452F' }}>
                            {ins.erDelta >= 0 ? '▲' : '▼'} {Math.abs(ins.erDelta).toFixed(1)}pt
                          </div>
                        )}
                      </div>
                    </div>
                    {ins.notes && <div className="text-[11px] text-[#8A8675] border-t border-[#F1ECDC] pt-2">{ins.notes}</div>}
                  </div>
                )
              })}
            </div>
            {/* Desktop: table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#FBF6E9]">
                    {['TANGGAL', 'REACH', 'LIKES', 'KOMEN', 'SAVES', 'SHARES', 'ER', 'CATATAN'].map(h => (
                      <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map(ins => {
                    const isBest = bestReach != null && ins.reach === bestReach
                    return (
                      <tr key={ins.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]" style={isBest ? { background: '#F3F6F0' } : undefined}>
                        <td className="p-[10px_14px] font-semibold text-[#2B2A24] whitespace-nowrap">
                          <div className="flex items-center gap-[6px]">
                            {formatDate(ins.insight_date, 'd MMM yyyy')}
                            {isBest && <span className="text-[9px] font-bold text-[#3C5A3B] bg-[#DCE7D6] rounded px-[6px] py-[1px]">terbaik</span>}
                          </div>
                        </td>
                        <td className="p-[10px_14px] tabular-nums text-[#5A574C] whitespace-nowrap">
                          {ins.reach != null ? formatNumber(ins.reach) : '—'}
                          {ins.reachDelta != null && ins.reachDelta !== 0 && (
                            <span className="ml-[6px] text-[10px] font-semibold" style={{ color: ins.reachDelta >= 0 ? '#4E7A4C' : '#B4452F' }}>
                              {ins.reachDelta >= 0 ? '▲' : '▼'} {formatNumber(Math.abs(ins.reachDelta))}
                            </span>
                          )}
                        </td>
                        <td className="p-[10px_14px] tabular-nums text-[#5A574C]">{ins.total_likes != null ? formatNumber(ins.total_likes) : '—'}</td>
                        <td className="p-[10px_14px] tabular-nums text-[#5A574C]">{ins.total_comments != null ? formatNumber(ins.total_comments) : '—'}</td>
                        <td className="p-[10px_14px] tabular-nums text-[#5A574C]">{ins.total_saves != null ? formatNumber(ins.total_saves) : '—'}</td>
                        <td className="p-[10px_14px] tabular-nums text-[#5A574C]">{ins.total_shares != null ? formatNumber(ins.total_shares) : '—'}</td>
                        <td className="p-[10px_14px] tabular-nums font-semibold whitespace-nowrap"
                          style={{ color: ins.engagement_rate != null ? erColor(ins.engagement_rate / 100) : '#9A9279' }}>
                          {ins.engagement_rate != null ? `${ins.engagement_rate.toFixed(2)}%` : '—'}
                          {ins.erDelta != null && Math.abs(ins.erDelta) >= 0.01 && (
                            <span className="ml-[6px] text-[10px] font-semibold" style={{ color: ins.erDelta >= 0 ? '#4E7A4C' : '#B4452F' }}>
                              {ins.erDelta >= 0 ? '▲' : '▼'} {Math.abs(ins.erDelta).toFixed(1)}pt
                            </span>
                          )}
                        </td>
                        <td className="p-[10px_14px] text-[#8A8675] max-w-[160px] truncate">{ins.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Sumber Data */}
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
        <div className="flex items-center gap-[10px] mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#EAF0FA] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F7CAC" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#2B2A24]">Sumber data</div>
            <div className="text-[11px] text-[#9A9279]">Auto-sync dari Repliz</div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#E9F3EA] rounded-md px-3 py-[8px] mb-4">
          <span className="w-[7px] h-[7px] rounded-full bg-[#5E8C61] flex-shrink-0"/>
          <span className="text-[12px] text-[#3F5A3E]">
            {latest?.updated_at
              ? <>Terakhir sync <b>{formatDateTime(latest.updated_at)}</b></>
              : 'Belum pernah sync'}
          </span>
        </div>
        <div className="text-[10px] font-semibold tracking-[.05em] text-[#9A9279] mb-2">BUTUH INPUT MANUAL</div>
        <div className="flex flex-col gap-2 mb-3">
          {[
            { key: 'followers', label: 'Followers', val: latest?.followers },
            { key: 'impressions', label: 'Impressions', val: latest?.impressions },
            { key: 'profile_visits', label: 'Profile visits', val: latest?.profile_visits },
            { key: 'dm_count', label: 'DM masuk', val: latest?.dm_count },
          ].map(f => (
            <div key={f.key} className="flex items-center justify-between border-t border-[#F1ECDC] pt-2 first:border-t-0 first:pt-0">
              <div>
                <div className="text-[13px] font-semibold text-[#2B2A24]">{f.label}</div>
                <div className="text-[11px]" style={{ color: f.val != null ? '#9A9279' : '#C77B3C' }}>
                  {f.val != null ? `${formatNumber(f.val)} · upd. ${latest ? formatDate(latest.insight_date, 'd MMM') : ''}` : 'Belum diisi'}
                </div>
              </div>
              <button onClick={() => openForm()} disabled={isAllBrands} className={inputBtnCls}>+ Input</button>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[#A89F86] border-t border-[#F1ECDC] pt-2">
          Kolom auto-sync diperbarui otomatis tiap pagi. Kolom manual diisi tim saat rekap harian.
        </div>
      </div>

      {/* FAB — input insight cepat, mobile only (desktop pakai tombol "+ Input Insight") */}
      <button onClick={() => openForm()} disabled={isAllBrands}
        title={isAllBrands ? 'Pilih brand dulu untuk input insight' : 'Input Insight'}
        className="md:hidden fixed right-[18px] bottom-[88px] z-40 w-[52px] h-[52px] rounded-full bg-[#5E7A5C] text-white border-none shadow-lg flex items-center justify-center text-[26px] leading-none cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)' }}>
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/[.28]" onClick={() => setShowForm(false)}/>
          <div className="absolute top-0 right-0 w-[420px] max-w-[94vw] h-full bg-[#FBF8EE] shadow-xl p-6 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#2B2A24]">Input Insight Harian</h3>
              <button onClick={() => setShowForm(false)} className="text-[#9A9279] text-xl border-none bg-none cursor-pointer">×</button>
            </div>
            <p className="text-[12px] text-[#9A9279]">Input ulang tanggal yang sama akan menimpa data lama.</p>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Tanggal *</label>
              <input className={inputCls} type="date" value={form.insight_date}
                onChange={e => setForm(f => ({ ...f, insight_date: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['followers', 'Followers'], ['reach', 'Reach'], ['impressions', 'Impressi'],
                ['profile_visits', 'Profile Visits'], ['link_clicks', 'Link Clicks'], ['dm_count', 'DM Masuk'],
                ['total_likes', 'Likes'], ['total_comments', 'Komentar'],
                ['total_saves', 'Saves'], ['total_shares', 'Shares'],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col gap-[6px]">
                  <label className="text-[12px] font-semibold text-[#5A574C]">{label}</label>
                  {numField(key)}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Catatan</label>
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Konten viral, kolaborasi, dsb..."
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
            </div>
            {err && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-2">{err}</div>}
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-[#EFEAD9] text-[#5A574C] border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer">
                Batal
              </button>
              <button onClick={handleSave} disabled={upsert.isPending}
                className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50">
                {upsert.isPending ? 'Menyimpan...' : 'Simpan Insight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

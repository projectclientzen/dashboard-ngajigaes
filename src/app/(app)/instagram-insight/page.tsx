'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useAccountInsights, useUpsertAccountInsight } from '@/lib/queries/instagram'
import { formatDate, formatNumber } from '@/lib/utils'

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="text-[11px] text-[#9A9279] font-medium mb-1">{label}</div>
      <div className="text-[20px] font-bold text-[#2B2A24]" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-[11px] text-[#A89F86] mt-[3px]">{sub}</div>}
    </div>
  )
}

function erColor(er: number) {
  if (er >= 0.03) return '#5E8C61'
  if (er >= 0.01) return '#C9A227'
  return '#C77B3C'
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-[60px] flex items-center justify-center text-[11px] text-[#A89F86]">Belum cukup data</div>
  const mn = Math.min(...values), mx = Math.max(...values)
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 90 - ((v - mn) / ((mx - mn) || 1)) * 80
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-[60px]">
      <polyline points={pts.join(' ')} fill="none" stroke="#5E7A5C" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

export default function InstagramInsightPage() {
  const { rangeStart, rangeEnd } = useApp()
  const insightsQ = useAccountInsights(rangeStart, rangeEnd)
  const upsert    = useUpsertAccountInsight()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    insight_date: new Date().toISOString().split('T')[0],
    followers: '', reach: '', impressions: '', profile_visits: '',
    link_clicks: '', dm_count: '', total_likes: '', total_comments: '',
    total_saves: '', total_shares: '', notes: '',
  })
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(false)

  const insights = insightsQ.data ?? []
  const latest   = insights[insights.length - 1]
  const prev     = insights[insights.length - 2]

  const growth = (latest?.followers ?? 0) - (prev?.followers ?? 0)
  const avgReach = insights.length
    ? Math.round(insights.reduce((a, i) => a + (i.reach ?? 0), 0) / insights.length)
    : 0
  const erList = insights.filter(i => i.engagement_rate != null)
  const avgEr = erList.length
    ? erList.reduce((a, i) => a + (i.engagement_rate ?? 0), 0) / erList.length
    : null

  function numField(key: string) {
    return (
      <input className={inputCls} type="number" min="0" placeholder="0"
        value={(form as Record<string, string>)[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
    )
  }

  async function handleSave() {
    setErr('')
    if (!form.insight_date) { setErr('Tanggal wajib diisi.'); return }
    const num = (v: string) => v ? parseInt(v) : undefined
    try {
      await upsert.mutateAsync({
        insight_date: form.insight_date,
        followers:     num(form.followers),
        reach:         num(form.reach),
        impressions:   num(form.impressions),
        profile_visits:num(form.profile_visits),
        link_clicks:   num(form.link_clicks),
        dm_count:      num(form.dm_count),
        total_likes:   num(form.total_likes),
        total_comments:num(form.total_comments),
        total_saves:   num(form.total_saves),
        total_shares:  num(form.total_shares),
        notes: form.notes || undefined,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      setShowForm(false)
      setForm({ insight_date: new Date().toISOString().split('T')[0], followers:'', reach:'', impressions:'', profile_visits:'', link_clicks:'', dm_count:'', total_likes:'', total_comments:'', total_saves:'', total_shares:'', notes:'' })
    } catch (e) { setErr((e as Error).message) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Followers" value={latest?.followers != null ? formatNumber(latest.followers) : '—'}
          sub={growth !== 0 ? `${growth > 0 ? '+' : ''}${growth} dari sebelumnya` : 'Belum ada perubahan'}
          color={growth > 0 ? '#5E8C61' : growth < 0 ? '#B4452F' : undefined}/>
        <MetricCard label="Avg Reach" value={avgReach > 0 ? formatNumber(avgReach) : '—'}
          sub={`${insights.length} hari data`}/>
        <MetricCard label="Engagement Rate" value={avgEr != null ? `${(avgEr * 100).toFixed(2)}%` : '—'}
          sub="rata-rata periode ini"
          color={avgEr != null ? erColor(avgEr) : undefined}/>
        <MetricCard label="DM Masuk" value={latest?.dm_count != null ? formatNumber(latest.dm_count) : '—'}
          sub="hari terakhir"/>
      </div>

      {insights.length > 1 && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#2B2A24]">Tren Reach</span>
            <span className="text-[11px] text-[#9A9279]">{rangeStart} → {rangeEnd}</span>
          </div>
          <Sparkline values={insights.map(i => i.reach ?? 0)}/>
          <div className="flex justify-between text-[10px] text-[#B0A78C] mt-1">
            <span>{formatDate(insights[0].insight_date, 'd MMM')}</span>
            <span>{formatDate(insights[insights.length - 1].insight_date, 'd MMM')}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#2B2A24]">Riwayat Insight ({insights.length} hari)</h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[12px] text-[#5E8C61] font-semibold">✓ Tersimpan</span>}
          <button onClick={() => setShowForm(true)}
            className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D]">
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
            <div className="text-[13px] text-[#9A9279]">Klik "+ Input Insight" untuk memasukkan data harian.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#FBF6E9]">
                  {['TANGGAL','FOLLOWERS','REACH','IMPRESI','LIKES','KOMEN','SAVES','ER'].map(h => (
                    <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...insights].reverse().map(ins => (
                  <tr key={ins.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                    <td className="p-[10px_14px] font-semibold text-[#2B2A24] whitespace-nowrap">{formatDate(ins.insight_date, 'd MMM yyyy')}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.followers != null ? formatNumber(ins.followers) : '—'}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.reach != null ? formatNumber(ins.reach) : '—'}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.impressions != null ? formatNumber(ins.impressions) : '—'}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.total_likes != null ? formatNumber(ins.total_likes) : '—'}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.total_comments != null ? formatNumber(ins.total_comments) : '—'}</td>
                    <td className="p-[10px_14px] text-[#5A574C]">{ins.total_saves != null ? formatNumber(ins.total_saves) : '—'}</td>
                    <td className="p-[10px_14px] font-semibold whitespace-nowrap"
                      style={{ color: ins.engagement_rate != null ? erColor(ins.engagement_rate) : '#9A9279' }}>
                      {ins.engagement_rate != null ? `${(ins.engagement_rate * 100).toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                ['followers','Followers'], ['reach','Reach'], ['impressions','Impressi'],
                ['profile_visits','Profile Visits'], ['link_clicks','Link Clicks'], ['dm_count','DM Masuk'],
                ['total_likes','Likes'], ['total_comments','Komentar'],
                ['total_saves','Saves'], ['total_shares','Shares'],
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

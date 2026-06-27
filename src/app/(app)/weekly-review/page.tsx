'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useWeeklyReviews, useUpsertWeeklyReview } from '@/lib/queries/weekly-review'
import { useSalesRecords } from '@/lib/queries/sales'
import { useTasks } from '@/lib/queries/tasks'
import { useAllKpiResults } from '@/lib/queries/kpi'
import { useAccountInsights } from '@/lib/queries/instagram'
import { formatRupiah, formatDate } from '@/lib/utils'

function getWeekRange(offsetWeeks = 0): { start: string; end: string; label: string } {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = (day === 0 ? -6 : 1 - day) + offsetWeeks * 7
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0,0,0,0)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const label = `${formatDate(fmt(mon), 'd MMM')} – ${formatDate(fmt(sun), 'd MMM yyyy')}`
  return { start: fmt(mon), end: fmt(sun), label }
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="text-[11px] text-[#9A9279] font-medium mb-1">{label}</div>
      <div className="text-[20px] font-bold text-[#2B2A24]" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="text-[11px] text-[#A89F86] mt-[3px]">{sub}</div>}
    </div>
  )
}

const textareaCls = 'border border-[#E3DCC8] rounded-md px-3 py-[10px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full resize-none leading-relaxed'
const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

export default function WeeklyReviewPage() {
  const { isLeader, userId } = useApp()
  const [weekOffset, setWeekOffset] = useState(0)
  const week = getWeekRange(weekOffset)

  const reviewsQ  = useWeeklyReviews()
  const salesQ    = useSalesRecords(week.start, week.end)
  const tasksQ    = useTasks()
  const kpiQ      = useAllKpiResults(week.start, week.end)
  const insightQ  = useAccountInsights(week.start, week.end)
  const upsert    = useUpsertWeeklyReview()

  const existing = (reviewsQ.data ?? []).find(
    r => r.period_start === week.start && r.period_end === week.end
  )

  const [form, setForm] = useState({ main_problem: '', leader_notes: '', decision: '' })
  const [saved, setSaved] = useState(false)
  const [actionPlans, setActionPlans] = useState<string[]>([''])

  useEffect(() => {
    setForm({
      main_problem: existing?.main_problem ?? '',
      leader_notes: existing?.leader_notes ?? '',
      decision: existing?.decision ?? '',
    })
    setSaved(false)
  }, [existing?.id, week.start])

  // Summary calcs
  const sales = salesQ.data ?? []
  const totalRevenue = sales.reduce((a, s) => a + s.net_revenue, 0)
  const totalOrders = sales.reduce((a, s) => a + s.order_count, 0)

  const tasks = tasksQ.data ?? []
  const weekTasks = tasks.filter(t => {
    if (!t.completed_at) return false
    const d = t.completed_at.split('T')[0]
    return d >= week.start && d <= week.end
  })
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalActiveTasks = tasks.filter(t => !['done','cancelled'].includes(t.status)).length

  const kpiResults = kpiQ.data ?? []
  const avgKpi = kpiResults.length
    ? kpiResults.reduce((a, k) => a + k.achievement_percentage, 0) / kpiResults.length
    : null

  const insights = insightQ.data ?? []
  const latestInsight = insights[0] ?? null

  async function handleSave() {
    await upsert.mutateAsync({
      ...(existing?.id ? { id: existing.id } : {}),
      period_start: week.start,
      period_end: week.end,
      main_problem: form.main_problem || undefined,
      leader_notes: form.leader_notes || undefined,
      decision: form.decision || undefined,
      created_by: userId ?? undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isLoading = reviewsQ.isLoading || salesQ.isLoading || tasksQ.isLoading

  return (
    <div className="flex flex-col gap-5">
      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => setWeekOffset(o => o - 1)}
          className="w-8 h-8 rounded-lg bg-[#EFEAD9] border-none cursor-pointer text-[#5A574C] hover:bg-[#E3DCC8] flex items-center justify-center text-[16px]">
          ‹
        </button>
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-[#2B2A24]">{week.label}</span>
          {weekOffset === 0 && <span className="text-[11px] text-[#5E8C61] font-semibold">Minggu ini</span>}
          {weekOffset === -1 && <span className="text-[11px] text-[#9A9279]">Minggu lalu</span>}
          {weekOffset < -1 && <span className="text-[11px] text-[#9A9279]">{Math.abs(weekOffset)} minggu lalu</span>}
        </div>
        <button onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
          disabled={weekOffset === 0}
          className="w-8 h-8 rounded-lg bg-[#EFEAD9] border-none cursor-pointer text-[#5A574C] hover:bg-[#E3DCC8] disabled:opacity-30 flex items-center justify-center text-[16px]">
          ›
        </button>
        {existing && (
          <span className="text-[11px] text-[#5E8C61] font-semibold bg-[#E9F1E6] px-[10px] py-[4px] rounded-full">
            ✓ Review tersimpan
          </span>
        )}
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="bg-white border border-[#EBE5D4] rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-[#EDE7D6] rounded w-1/2 mb-2"/>
              <div className="h-6 bg-[#EDE7D6] rounded w-3/4"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLeader && (
            <SummaryCard
              label="Revenue Minggu Ini"
              value={formatRupiah(totalRevenue)}
              sub={`${totalOrders} order`}
              color={totalRevenue > 0 ? '#5E7A5C' : undefined}
            />
          )}
          <SummaryCard
            label="Task Selesai"
            value={String(weekTasks.length)}
            sub={`${totalActiveTasks} task aktif`}
            color={weekTasks.length > 0 ? '#4F7CAC' : undefined}
          />
          <SummaryCard
            label="Rata-rata KPI"
            value={avgKpi !== null ? `${avgKpi.toFixed(0)}%` : '—'}
            sub={kpiResults.length > 0 ? `${kpiResults.length} KPI dievaluasi` : 'Belum ada data'}
            color={avgKpi !== null ? (avgKpi >= 100 ? '#5E8C61' : avgKpi >= 80 ? '#4F7CAC' : '#C77B3C') : undefined}
          />
          <SummaryCard
            label="Reach Instagram"
            value={latestInsight?.reach != null ? latestInsight.reach.toLocaleString('id-ID') : '—'}
            sub={latestInsight?.engagement_rate != null ? `ER ${(latestInsight.engagement_rate * 100).toFixed(1)}%` : 'Belum ada insight'}
          />
        </div>
      )}

      {/* Review form — Leader only */}
      {isLeader ? (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-[14px] font-bold text-[#2B2A24]">Catatan Review</h3>

          <div>
            <label className="text-[12px] font-semibold text-[#5A574C] block mb-[6px]">
              Problem Utama Minggu Ini
            </label>
            <textarea className={textareaCls} rows={3}
              placeholder="Apa masalah utama atau hambatan yang dihadapi tim minggu ini?"
              value={form.main_problem}
              onChange={e => setForm(f => ({ ...f, main_problem: e.target.value }))}/>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#5A574C] block mb-[6px]">
              Catatan Leader
            </label>
            <textarea className={textareaCls} rows={3}
              placeholder="Observasi, apresiasi, atau feedback umum untuk tim..."
              value={form.leader_notes}
              onChange={e => setForm(f => ({ ...f, leader_notes: e.target.value }))}/>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#5A574C] block mb-[6px]">
              Keputusan & Arahan
            </label>
            <textarea className={textareaCls} rows={3}
              placeholder="Keputusan yang diambil untuk minggu depan..."
              value={form.decision}
              onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}/>
          </div>

          {/* Action Plans */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-[#5A574C]">Action Plan Minggu Depan</label>
              <button onClick={() => setActionPlans(p => [...p, ''])}
                className="text-[11px] text-[#4F7CAC] border-none bg-none cursor-pointer hover:underline">
                + Tambah
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {actionPlans.map((ap, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[12px] text-[#B0A78C] w-5 text-right flex-shrink-0">{i + 1}.</span>
                  <input className={inputCls} placeholder={`Action plan ${i + 1}...`}
                    value={ap}
                    onChange={e => setActionPlans(p => p.map((v, j) => j === i ? e.target.value : v))}/>
                  {actionPlans.length > 1 && (
                    <button onClick={() => setActionPlans(p => p.filter((_, j) => j !== i))}
                      className="text-[#B4452F] border-none bg-none cursor-pointer text-[16px] leading-none flex-shrink-0">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={upsert.isPending}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50 transition-colors">
              {upsert.isPending ? 'Menyimpan...' : 'Simpan Review'}
            </button>
            {saved && <span className="text-[12px] text-[#5E8C61] font-semibold">✓ Review berhasil disimpan</span>}
          </div>
        </div>
      ) : (
        /* Tim view — baca-only */
        existing ? (
          <div className="bg-white border border-[#EBE5D4] rounded-lg p-5 flex flex-col gap-4">
            <h3 className="text-[14px] font-bold text-[#2B2A24]">Catatan Leader — {week.label}</h3>
            {existing.main_problem && (
              <div>
                <div className="text-[11px] font-semibold text-[#9A9279] mb-1">PROBLEM UTAMA</div>
                <p className="text-[13px] text-[#3F3D34] leading-relaxed">{existing.main_problem}</p>
              </div>
            )}
            {existing.leader_notes && (
              <div>
                <div className="text-[11px] font-semibold text-[#9A9279] mb-1">CATATAN LEADER</div>
                <p className="text-[13px] text-[#3F3D34] leading-relaxed">{existing.leader_notes}</p>
              </div>
            )}
            {existing.decision && (
              <div>
                <div className="text-[11px] font-semibold text-[#9A9279] mb-1">KEPUTUSAN & ARAHAN</div>
                <p className="text-[13px] text-[#3F3D34] leading-relaxed">{existing.decision}</p>
              </div>
            )}
            {!existing.main_problem && !existing.leader_notes && !existing.decision && (
              <p className="text-[13px] text-[#9A9279]">Leader belum mengisi catatan untuk minggu ini.</p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#EBE5D4] rounded-lg p-8 text-center">
            <p className="text-[14px] font-bold text-[#2B2A24] mb-1">Belum ada review</p>
            <p className="text-[13px] text-[#9A9279]">Leader belum membuat weekly review untuk minggu ini.</p>
          </div>
        )
      )}

      {/* Riwayat review sebelumnya */}
      {(reviewsQ.data ?? []).filter(r => r.period_start !== week.start).length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-[#5A574C] mb-3">Riwayat Review</h3>
          <div className="flex flex-col gap-2">
            {(reviewsQ.data ?? [])
              .filter(r => r.period_start !== week.start)
              .slice(0, 5)
              .map(r => (
                <div key={r.id}
                  className="bg-white border border-[#EBE5D4] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#FDFAF3]"
                  onClick={() => {
                    const d = new Date(r.period_start)
                    const now = new Date()
                    const curr = getWeekRange(0)
                    const daysDiff = Math.round((new Date(curr.start).getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
                    setWeekOffset(-daysDiff)
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#2B2A24]">
                      {formatDate(r.period_start, 'd MMM')} – {formatDate(r.period_end, 'd MMM yyyy')}
                    </span>
                    <span className="text-[11px] text-[#5E8C61] font-semibold">✓ Tersimpan</span>
                  </div>
                  {r.main_problem && (
                    <p className="text-[12px] text-[#9A9279] mt-1 truncate">{r.main_problem}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

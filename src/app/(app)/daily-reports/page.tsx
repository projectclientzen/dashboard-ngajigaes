'use client'

import { useState, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useDailyReports, useUpsertDailyReport } from '@/lib/queries/daily-reports'
import { useKpis, useUpsertKpiResult, fetchDailyKpiEntries } from '@/lib/queries/kpi'
import { getInitials, todayJakarta, formatDate } from '@/lib/utils'
import type { Kpi } from '@/types'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

interface KpiEntry { kpi_id: string; qty: string }

export default function DailyReportsPage() {
  const { userId, isLeader, isLoading: authLoading, rangeStart, rangeEnd } = useApp()
  const today = todayJakarta()

  const reportsQ  = useDailyReports(today, isLeader ? undefined : userId ?? undefined)
  const kpisQ     = useKpis()
  const upsert    = useUpsertDailyReport()
  const upsertKpi = useUpsertKpiResult()

  const [plan, setPlan]       = useState('')
  const [done, setDone]       = useState('')
  const [blocker, setBlocker] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // KPI entries — list pasangan kpi_id + qty (optional)
  const [kpiEntries, setKpiEntries] = useState<KpiEntry[]>([{ kpi_id: '', qty: '' }])

  // KPI yang relevan untuk user ini (global atau assigned)
  const myKpis: Kpi[] = (kpisQ.data ?? []).filter(
    k => k.user_id === userId || k.user_id === null
  )

  function addKpiRow() {
    setKpiEntries(prev => [...prev, { kpi_id: '', qty: '' }])
  }
  function removeKpiRow(i: number) {
    setKpiEntries(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateKpiRow(i: number, field: keyof KpiEntry, val: string) {
    setKpiEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  const syncKpi = useCallback(async () => {
    if (!userId) return
    // Ambil semua daily_report entries dalam periode (termasuk yg baru disimpan)
    const accumulated = await fetchDailyKpiEntries(userId, rangeStart, rangeEnd)
    // Upsert kpi_result untuk setiap kpi yang punya qty
    for (const { kpi_id, qty } of accumulated) {
      const kpi = (kpisQ.data ?? []).find(k => k.id === kpi_id)
      if (!kpi) continue
      const pct = (qty / kpi.target_value) * 100
      await upsertKpi.mutateAsync({
        kpi_id,
        user_id: userId,
        period_start: rangeStart,
        period_end: rangeEnd,
        target_value: kpi.target_value,
        actual_value: qty,
        achievement_percentage: pct,
        weighted_score: Math.min(100, pct) * (kpi.weight / 100),
        input_type: 'automatic',
      })
    }
  }, [userId, rangeStart, rangeEnd, kpisQ.data, upsertKpi])

  async function handleSubmit() {
    if (!plan && !done) return
    if (!userId) return

    // Siapkan kpi_entries yang valid (ada kpi_id dan qty > 0)
    const validEntries = kpiEntries
      .filter(e => e.kpi_id && e.qty && parseFloat(e.qty) > 0)
      .map(e => ({ kpi_id: e.kpi_id, qty: parseFloat(e.qty) }))

    await upsert.mutateAsync({
      user_id: userId,
      report_date: today,
      plan_today: plan || undefined,
      completed_work: done || undefined,
      blockers: blocker || undefined,
      kpi_entries: validEntries.length > 0 ? validEntries : undefined,
    })

    // Sync KPI jika ada entry
    if (validEntries.length > 0) {
      setSyncing(true)
      try { await syncKpi() } finally { setSyncing(false) }
    }

    setPlan(''); setDone(''); setBlocker('')
    setKpiEntries([{ kpi_id: '', qty: '' }])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const reports = reportsQ.data ?? []
  const taClass = "w-full mt-[6px] mb-[14px] border border-[#E3DCC8] rounded-md p-[10px] text-[13px] font-sans resize-y min-h-[64px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors"
  const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[8px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors'

  if (authLoading) return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1.25fr 1fr' }}>

        {/* Form laporan */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-[18px]">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[3px]">Laporan Hari Ini · {formatDate(today, 'd MMM yyyy')}</div>
          <div className="text-[12px] text-[#A89F86] mb-4">Satu laporan per hari, bisa diedit di hari yang sama.</div>

          <label className="text-[12px] font-semibold text-[#5A574C]">Rencana hari ini</label>
          <textarea className={taClass} placeholder="Apa yang akan dikerjakan hari ini?" value={plan}
            onChange={e => { setPlan(e.target.value); setSubmitted(false) }}/>

          <label className="text-[12px] font-semibold text-[#5A574C]">Yang sudah selesai</label>
          <textarea className={taClass} placeholder="Pekerjaan yang sudah kelar" value={done}
            onChange={e => { setDone(e.target.value); setSubmitted(false) }}/>

          <label className="text-[12px] font-semibold text-[#5A574C]">Blocker / kendala</label>
          <textarea className={taClass} style={{ minHeight: 48 }} placeholder="Kendala yang dihadapi (opsional)"
            value={blocker} onChange={e => setBlocker(e.target.value)}/>

          {/* ── Section KPI ──────────────────────────────────── */}
          {myKpis.length > 0 && (
            <div className="mt-1 mb-[14px] border border-[#E3DCC8] rounded-lg overflow-hidden">
              <div className="px-[12px] py-[10px] bg-[#F8F4E8] flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-[#2B2A24]">Update KPI Hari Ini</div>
                  <div className="text-[11px] text-[#A89F86] mt-[1px]">Opsional · hanya untuk KPI berbasis qty (konten, ebook, dll)</div>
                </div>
              </div>
              <div className="p-[12px] flex flex-col gap-[8px]">
                {kpiEntries.map((entry, i) => {
                  const selectedKpi = myKpis.find(k => k.id === entry.kpi_id)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className={`${inputCls} flex-1`}
                        value={entry.kpi_id}
                        onChange={e => updateKpiRow(i, 'kpi_id', e.target.value)}>
                        <option value="">Pilih KPI...</option>
                        {myKpis.map(k => (
                          <option key={k.id} value={k.id}>{k.name} (target: {k.target_value} {k.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        className={`${inputCls} w-[80px] text-center`}
                        placeholder={selectedKpi?.unit ?? 'qty'}
                        value={entry.qty}
                        onChange={e => updateKpiRow(i, 'qty', e.target.value)}/>
                      {kpiEntries.length > 1 && (
                        <button onClick={() => removeKpiRow(i)}
                          className="text-[#B4452F] text-[18px] leading-none border-none bg-none cursor-pointer flex-shrink-0 w-6 text-center">
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
                <button onClick={addKpiRow}
                  className="text-[12px] text-[#4F7CAC] border-none bg-none cursor-pointer text-left p-0 hover:underline">
                  + Tambah KPI lain
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={handleSubmit} disabled={upsert.isPending || syncing}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-5 py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors disabled:opacity-60">
              {syncing ? 'Sync KPI...' : upsert.isPending ? 'Menyimpan...' : 'Kirim Laporan'}
            </button>
            {submitted && <span className="text-[12px] font-semibold text-[#5E8C61]">✓ Laporan & KPI tersimpan</span>}
          </div>
        </div>

        {/* Panel kanan — laporan hari ini */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-[18px]">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Laporan Hari Ini</div>
          {reportsQ.isLoading ? (
            <div className="text-[13px] text-[#A89F86]">Memuat...</div>
          ) : reports.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada laporan hari ini.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-2 py-2 border-b border-[#F1ECDC]">
                  <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                    style={{ background: avatarColor(r.user_name) }}>
                    {getInitials(r.user_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#2B2A24]">{r.user_name}</div>
                    <div className="text-[11px] text-[#A89F86] truncate">{r.plan_today ?? '—'}</div>
                    {r.kpi_entries && r.kpi_entries.length > 0 && (
                      <div className="flex flex-wrap gap-[4px] mt-[3px]">
                        {r.kpi_entries.map((e, i) => {
                          const k = myKpis.find(kk => kk.id === e.kpi_id)
                          return (
                            <span key={i} className="text-[10px] bg-[#E8F0F6] text-[#4F7CAC] rounded-full px-[7px] py-[2px] font-semibold">
                              {k?.name ?? 'KPI'}: {e.qty} {k?.unit ?? ''}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-[#5E8C61] bg-[#E9F1E6] rounded-full px-2 py-0.5">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabel laporan masuk */}
      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">
          Laporan Masuk ({reports.length})
        </div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#FBF6E9]">
              {['ANGGOTA','RENCANA','SELESAI','BLOCKER','KPI HARI INI'].map(h => (
                <th key={h} className="p-[10px_16px] text-left text-[10px] font-semibold text-[#9A9279]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-[13px] text-[#A89F86]">Belum ada laporan.</td></tr>
            )}
            {reports.map(r => (
              <tr key={r.id} className="border-t border-[#F1ECDC] align-top">
                <td className="p-[12px_16px]">
                  <div className="flex items-center gap-2">
                    <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                      style={{ background: avatarColor(r.user_name) }}>
                      {getInitials(r.user_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#2B2A24]">{r.user_name}</div>
                      <div className="text-[10px] text-[#A89F86]">{formatDate(r.report_date, 'd MMM')}</div>
                    </div>
                  </div>
                </td>
                <td className="p-[12px_16px] text-[#5A574C] max-w-[180px]">{r.plan_today ?? '—'}</td>
                <td className="p-[12px_16px] text-[#5A574C] max-w-[180px]">{r.completed_work ?? '—'}</td>
                <td className="p-[12px_16px] font-medium max-w-[130px]"
                  style={{ color: r.blockers && r.blockers !== '-' ? '#B4452F' : '#B0A78C' }}>
                  {r.blockers || '—'}
                </td>
                <td className="p-[12px_16px]">
                  {r.kpi_entries && r.kpi_entries.length > 0 ? (
                    <div className="flex flex-col gap-[3px]">
                      {r.kpi_entries.map((e, i) => {
                        const k = (kpisQ.data ?? []).find(kk => kk.id === e.kpi_id)
                        return (
                          <span key={i} className="text-[11px] text-[#4F7CAC] font-semibold">
                            {k?.name ?? '—'}: {e.qty} {k?.unit ?? ''}
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-[#B0A78C]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

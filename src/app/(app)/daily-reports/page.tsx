'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useDailyReports, useUpsertDailyReport } from '@/lib/queries/daily-reports'
import { getInitials, todayJakarta, formatDate } from '@/lib/utils'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

export default function DailyReportsPage() {
  const { userId, isLeader, isLoading: authLoading } = useApp()
  const today = todayJakarta()

  const reportsQ = useDailyReports(today, isLeader ? undefined : userId ?? undefined)
  const upsert = useUpsertDailyReport()

  const [plan, setPlan] = useState('')
  const [done, setDone] = useState('')
  const [blocker, setBlocker] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!plan && !done) return
    if (!userId) return
    await upsert.mutateAsync({
      user_id: userId,
      report_date: today,
      plan_today: plan || undefined,
      completed_work: done || undefined,
      blockers: blocker || undefined,
    })
    setPlan(''); setDone(''); setBlocker('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const reports = reportsQ.data ?? []
  const taClass = "w-full mt-[6px] mb-[14px] border border-[#E3DCC8] rounded-md p-[10px] text-[13px] font-sans resize-y min-h-[64px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors"

  if (authLoading) return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-[18px]">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[3px]">Laporan Hari Ini · {formatDate(today, 'd MMM yyyy')}</div>
          <div className="text-[12px] text-[#A89F86] mb-4">Satu laporan per hari, bisa diedit di hari yang sama.</div>
          <label className="text-[12px] font-semibold text-[#5A574C]">Rencana hari ini</label>
          <textarea className={taClass} placeholder="Apa yang akan dikerjakan hari ini?" value={plan} onChange={e => { setPlan(e.target.value); setSubmitted(false) }}/>
          <label className="text-[12px] font-semibold text-[#5A574C]">Yang sudah selesai</label>
          <textarea className={taClass} placeholder="Pekerjaan yang sudah kelar" value={done} onChange={e => { setDone(e.target.value); setSubmitted(false) }}/>
          <label className="text-[12px] font-semibold text-[#5A574C]">Blocker / kendala</label>
          <textarea className={taClass} style={{ minHeight: 48 }} placeholder="Kendala yang dihadapi (opsional)" value={blocker} onChange={e => setBlocker(e.target.value)}/>
          <div className="flex items-center gap-3">
            <button onClick={handleSubmit} disabled={upsert.isPending}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-5 py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors disabled:opacity-60">
              {upsert.isPending ? 'Menyimpan...' : 'Kirim Laporan'}
            </button>
            {submitted && <span className="text-[12px] font-semibold text-[#5E8C61]">✓ Laporan tersimpan</span>}
          </div>
        </div>
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
              {['ANGGOTA','RENCANA','SELESAI','BLOCKER'].map(h => (
                <th key={h} className="p-[10px_16px] text-left text-[10px] font-semibold text-[#9A9279]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-[13px] text-[#A89F86]">Belum ada laporan.</td></tr>
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
                <td className="p-[12px_16px] text-[#5A574C] max-w-[200px]">{r.plan_today ?? '—'}</td>
                <td className="p-[12px_16px] text-[#5A574C] max-w-[200px]">{r.completed_work ?? '—'}</td>
                <td className="p-[12px_16px] font-medium max-w-[150px]"
                  style={{ color: r.blockers && r.blockers !== '-' ? '#B4452F' : '#B0A78C' }}>
                  {r.blockers || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

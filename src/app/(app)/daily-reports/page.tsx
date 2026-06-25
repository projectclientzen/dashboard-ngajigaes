'use client'

import { useState } from 'react'
import { useMock } from '@/contexts/MockContext'
import { getInitials, todayJakarta, formatDate } from '@/lib/utils'
import { MOCK_DAILY_REPORTS, MOCK_MISSING_REPORTS, MOCK_USERS } from '@/lib/mock'
import { ROLE_NAMES } from '@/lib/constants'
import type { DailyReport } from '@/types'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export default function DailyReportsPage() {
  const { data, currentRole } = useMock()
  const isLeader = currentRole === 'leader'
  const today = todayJakarta()

  const [plan, setPlan] = useState('')
  const [done, setDone] = useState('')
  const [blocker, setBlocker] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [reports, setReports] = useState<DailyReport[]>(data.dailyReports)

  function handleSubmit() {
    if (!plan && !done) return
    const newReport: DailyReport = {
      id: `report-new-${Date.now()}`,
      user_id: data.currentUser.id,
      user_name: data.currentUser.name,
      report_date: today,
      plan_today: plan || null,
      completed_work: done || null,
      unfinished_work: null,
      blockers: blocker || null,
      ideas_insights: null,
      notes: null,
      work_link: null,
    }
    setReports(prev => [newReport, ...prev])
    setPlan(''); setDone(''); setBlocker('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const todayReports = reports.filter(r => r.report_date === today)
  const missing = data.missingReports

  const textareaClass = "w-full mt-[6px] mb-[14px] border border-[#E3DCC8] rounded-md p-[10px] text-[13px] font-sans resize-y min-h-[64px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B]"

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="grid gap-[14px]" style={{ gridTemplateColumns: '1.25fr 1fr' }}>
        {/* Form */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-[18px]">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[3px]">
            Laporan Hari Ini · {formatDate(today, 'd MMM yyyy')}
          </div>
          <div className="text-[12px] text-[#A89F86] mb-4">
            Satu laporan per hari, bisa diedit di hari yang sama.
          </div>

          <label className="text-[12px] font-semibold text-[#5A574C]">Rencana hari ini</label>
          <textarea className={textareaClass} placeholder="Apa yang akan dikerjakan hari ini?"
            value={plan} onChange={e => { setPlan(e.target.value); setSubmitted(false) }} />

          <label className="text-[12px] font-semibold text-[#5A574C]">Yang sudah selesai</label>
          <textarea className={textareaClass} placeholder="Pekerjaan yang sudah kelar"
            value={done} onChange={e => { setDone(e.target.value); setSubmitted(false) }} />

          <label className="text-[12px] font-semibold text-[#5A574C]">Blocker / kendala</label>
          <textarea className={textareaClass} style={{ minHeight: 48 }} placeholder="Kendala yang dihadapi (opsional)"
            value={blocker} onChange={e => setBlocker(e.target.value)} />

          <div className="flex items-center gap-3">
            <button onClick={handleSubmit}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-5 py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors">
              Kirim Laporan
            </button>
            {submitted && <span className="text-[12px] font-semibold text-[#5E8C61]">✓ Laporan tersimpan</span>}
          </div>
        </div>

        {/* Belum Mengisi */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-[18px]">
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-[13px] font-bold text-[#2B2A24]">Belum Mengisi</div>
            <span className="text-[12px] font-bold text-[#C77B3C] bg-[#F8EEE2] rounded-full px-[10px] py-[2px]">
              {missing.length} orang
            </span>
          </div>
          {missing.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Semua anggota sudah mengisi ✓</div>
          ) : (
            <div className="flex flex-col gap-[9px]">
              {missing.map(u => {
                const user = MOCK_USERS.find(mu => mu.id === u.user_id)
                return (
                  <div key={u.user_id} className="flex items-center gap-[10px] px-[10px] py-2 bg-[#FBF4EC] border border-[#EFE2D2] rounded-[7px]">
                    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white"
                      style={{ background: avatarColor(u.user_name) }}>
                      {getInitials(u.user_name)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-[#2B2A24]">{u.user_name}</div>
                      <div className="text-[11px] text-[#A89F86]">
                        {user ? ROLE_NAMES[user.role] : ''}
                      </div>
                    </div>
                    <button className="text-[11px] font-semibold text-[#C77B3C] bg-none border border-[#E7C9A8] rounded-[5px] px-[9px] py-1 cursor-pointer hover:bg-[#F8EEE2] transition-colors">
                      Ingatkan
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Laporan masuk */}
      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">
          {isLeader ? `Laporan Masuk Hari Ini (${todayReports.length})` : 'Laporan Saya'}
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
            {(isLeader ? todayReports : reports.filter(r => r.user_id === data.currentUser.id)).map(r => (
              <tr key={r.id} className="border-t border-[#F1ECDC] align-top">
                <td className="p-[12px_16px]">
                  <div className="flex items-center gap-2">
                    <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                      style={{ background: avatarColor(r.user_name) }}>
                      {getInitials(r.user_name)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#2B2A24]">{r.user_name}</div>
                      <div className="text-[10px] text-[#A89F86]">{formatDate(r.report_date, 'd MMM yyyy')}</div>
                    </div>
                  </div>
                </td>
                <td className="p-[12px_16px] text-[#5A574C] max-w-[240px]">{r.plan_today ?? '—'}</td>
                <td className="p-[12px_16px] text-[#5A574C] max-w-[240px]">{r.completed_work ?? '—'}</td>
                <td className="p-[12px_16px] font-medium max-w-[180px]"
                  style={{ color: r.blockers && r.blockers !== '-' ? '#B4452F' : '#B0A78C' }}>
                  {r.blockers || '—'}
                </td>
              </tr>
            ))}
            {(isLeader ? todayReports : reports).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[13px] text-[#A89F86]">
                  Belum ada laporan hari ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useApp } from '@/contexts/AppContext'
import { useAllKpiResults } from '@/lib/queries/kpi'
import { getInitials, formatNumber } from '@/lib/utils'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

function barColor(pct: number) {
  if (pct >= 100) return '#5E8C61'
  if (pct >= 80) return '#C9A227'
  return '#C77B3C'
}

export default function KpiPage() {
  const { userId, isLeader, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const allQ = useAllKpiResults(rangeStart, rangeEnd)

  if (authLoading || allQ.isLoading) {
    return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>
  }

  const rows = isLeader
    ? (allQ.data ?? [])
    : (allQ.data ?? []).filter(r => r.user_id === userId)

  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-[14px] border-b border-[#F1ECDC]">
        <div className="text-[13px] font-bold text-[#2B2A24]">{isLeader ? 'KPI & Scorecard Tim' : 'KPI Saya'}</div>
        {isLeader && (
          <button className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer">
            + Buat KPI
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-[13px] text-[#A89F86]">
          Belum ada data KPI untuk periode ini.
        </div>
      ) : (
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#FBF6E9]">
              {['KPI','USER','TARGET','AKTUAL','ACHIEVEMENT'].map((h, i) => (
                <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]"
                  style={i === 4 ? { width: 200 } : {}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((k, idx) => {
              const pct = Math.round(k.achievement_percentage)
              const cap = Math.min(100, pct)
              const bc = barColor(pct)
              const name = k.user_id
              const initials = name.slice(0, 2).toUpperCase()
              return (
                <tr key={`${k.kpi_id}-${k.user_id}-${idx}`} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                  <td className="p-[12px_16px] font-semibold text-[#2B2A24]">{k.kpi_name}</td>
                  <td className="p-[12px_16px]">
                    <div className="flex items-center gap-[7px]">
                      <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[9px] font-semibold text-white"
                        style={{ background: avatarColor(name) }}>
                        {initials}
                      </div>
                      <span className="text-[#5A574C] text-[12px] truncate max-w-[100px]">{name.slice(0,8)}…</span>
                    </div>
                  </td>
                  <td className="p-[12px_16px] text-[#7A766B]">{formatNumber(k.target_value)}</td>
                  <td className="p-[12px_16px] font-semibold text-[#2B2A24]">{formatNumber(k.actual_value)}</td>
                  <td className="p-[12px_16px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="flex-1 h-[7px] bg-[#EDE7D6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-[width_.4s]" style={{ width: `${cap}%`, background: bc }}/>
                      </div>
                      <span className="text-[12px] font-bold w-[38px] text-right" style={{ color: bc }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

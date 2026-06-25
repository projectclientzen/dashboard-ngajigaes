'use client'

import { useMock } from '@/contexts/MockContext'
import { getInitials } from '@/lib/utils'
import { ROLE_NAMES } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function statusMeta(status: string) {
  const M: Record<string, { t: string; c: string; bg: string }> = {
    excellent:       { t: 'Excellent',       c: '#5E8C61', bg: '#E9F1E6' },
    good:            { t: 'Good',            c: '#4F7CAC', bg: '#E8F0F6' },
    need_improvement:{ t: 'Perlu Perbaikan', c: '#B58A1E', bg: '#F6EFD8' },
    warning:         { t: 'Warning',         c: '#C77B3C', bg: '#F8EEE2' },
    critical:        { t: 'Critical',        c: '#B4452F', bg: '#F7E7E2' },
  }
  return M[status] ?? M.good
}

function ScoreTrendChart() {
  const trend = [72, 75, 71, 78, 82, 80]
  const mn = Math.min(...trend), mx = Math.max(...trend)
  const pts = trend.map((v, i): [number, number] => [
    (i / (trend.length - 1)) * 100,
    40 - ((v - mn) / ((mx - mn) || 1)) * 30 - 5,
  ])
  const d = 'M ' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ')
  const area = d + ' L 100 42 L 0 42 Z'
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="text-[13px] font-bold text-[#2B2A24] mb-[10px]">Tren Rata-rata Final Score</div>
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" style={{ width: '100%', height: 120, display: 'block' }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7E997B" stopOpacity="0.25" />
            <stop offset="1" stopColor="#7E997B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#sg)" />
        <path d={d} fill="none" stroke="#5E7A5C" strokeWidth="0.8" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-[#B0A78C] mt-1">
        {['Mgg 1','Mgg 2','Mgg 3','Mgg 4','Mgg 5','Mgg 6'].map(w => <span key={w}>{w}</span>)}
      </div>
    </div>
  )
}

export default function TeamPerformancePage() {
  const { data, currentRole } = useMock()
  const router = useRouter()

  // Redirect non-leader
  useEffect(() => {
    if (currentRole !== 'leader') router.replace('/dashboard')
  }, [currentRole, router])

  if (currentRole !== 'leader') {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
        <div className="text-[16px] font-bold text-[#2B2A24]">Akses Terbatas</div>
        <div className="text-[13px] text-[#9A9279]">Halaman ini hanya dapat diakses oleh Leader.</div>
      </div>
    )
  }

  const scores = [...data.productivityScores].sort((a, b) => b.final_score - a.final_score)

  return (
    <div className="flex flex-col gap-[14px]">
      <ScoreTrendChart />

      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">
          Ranking Produktivitas
        </div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#FBF6E9]">
              {['#','ANGGOTA','TASK','DEADLINE','KPI','QUALITY','INISIATIF','FINAL','STATUS'].map(h => (
                <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold text-[#9A9279]"
                  style={['TASK','DEADLINE','KPI','QUALITY','INISIATIF','FINAL'].includes(h) ? { textAlign: 'center' } : {}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((sc, i) => {
              const sm = statusMeta(sc.status)
              const bg = AVATAR_COLORS[i % AVATAR_COLORS.length]
              return (
                <tr key={sc.user_id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                  <td className="p-[11px_14px] font-bold text-[#B0A78C]">{i + 1}</td>
                  <td className="p-[11px_14px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ background: bg }}>
                        {getInitials(sc.user_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#2B2A24]">{sc.user_name}</div>
                        <div className="text-[10px] text-[#A89F86]">Anggota Tim</div>
                      </div>
                    </div>
                  </td>
                  {[sc.task_completion_score, sc.deadline_accuracy_score, sc.kpi_score,
                    sc.quality_score ?? '—', sc.initiative_score ?? '—'].map((v, j) => (
                    <td key={j} className="p-[11px_14px] text-center text-[#5A574C]">
                      {typeof v === 'number' ? `${v}%` : v}
                    </td>
                  ))}
                  <td className="p-[11px_14px] text-center font-bold" style={{ color: sm.c }}>
                    {sc.final_score}
                  </td>
                  <td className="p-[11px_14px]">
                    <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full"
                      style={{ color: sm.c, background: sm.bg }}>
                      {sm.t}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

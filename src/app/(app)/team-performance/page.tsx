'use client'

import { useApp } from '@/contexts/AppContext'
import { useProductivityScores } from '@/lib/queries/productivity'
import { getInitials } from '@/lib/utils'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

function statusMeta(status: string) {
  const M: Record<string, { t: string; c: string; bg: string }> = {
    excellent:       { t:'Excellent',       c:'#5E8C61', bg:'#E9F1E6' },
    good:            { t:'Good',            c:'#4F7CAC', bg:'#E8F0F6' },
    need_improvement:{ t:'Perlu Perbaikan', c:'#B58A1E', bg:'#F6EFD8' },
    warning:         { t:'Warning',         c:'#C77B3C', bg:'#F8EEE2' },
    critical:        { t:'Critical',        c:'#B4452F', bg:'#F7E7E2' },
  }
  return M[status] ?? M.critical
}

export default function TeamPerformancePage() {
  const { isLeader, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const scoresQ = useProductivityScores(rangeStart, rangeEnd)

  if (!isLeader) {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
        <div className="text-[16px] font-bold text-[#2B2A24]">Akses Terbatas</div>
        <div className="text-[13px] text-[#9A9279]">Halaman ini hanya dapat diakses oleh Leader.</div>
      </div>
    )
  }

  if (authLoading || scoresQ.isLoading) return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>

  const scores = scoresQ.data ?? []

  return (
    <div className="flex flex-col gap-[14px]">
      {scores.length === 0 ? (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 text-center text-[13px] text-[#A89F86]">
          Belum ada data productivity score untuk periode ini. Jalankan close_weekly_review untuk generate snapshot.
        </div>
      ) : (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">
            Ranking Produktivitas
          </div>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#FBF6E9]">
                {['#','ANGGOTA','TASK','DEADLINE','KPI','QUALITY','INISIATIF','FINAL','STATUS'].map(h => (
                  <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold text-[#9A9279]"
                    style={['TASK','DEADLINE','KPI','QUALITY','INISIATIF','FINAL'].includes(h) ? { textAlign:'center' } : {}}>
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
                        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: bg }}>
                          {getInitials(sc.user_name)}
                        </div>
                        <div className="font-semibold text-[#2B2A24]">{sc.user_name}</div>
                      </div>
                    </td>
                    {[sc.task_completion_score, sc.deadline_accuracy_score, sc.kpi_score,
                      sc.quality_score ?? '—', sc.initiative_score ?? '—'].map((v, j) => (
                      <td key={j} className="p-[11px_14px] text-center text-[#5A574C]">
                        {typeof v === 'number' ? `${v}%` : v}
                      </td>
                    ))}
                    <td className="p-[11px_14px] text-center font-bold" style={{ color: sm.c }}>{sc.final_score}</td>
                    <td className="p-[11px_14px]">
                      <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color: sm.c, background: sm.bg }}>{sm.t}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

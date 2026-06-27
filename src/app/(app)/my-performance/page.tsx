'use client'

import { useApp } from '@/contexts/AppContext'
import { useMyScore, useProductivityScores } from '@/lib/queries/productivity'

const STATUS_META = {
  excellent:        { label: 'Excellent',       c: '#5E8C61', bg: '#E9F3EA' },
  good:             { label: 'Good',            c: '#4F7CAC', bg: '#E8F0F6' },
  need_improvement: { label: 'Perlu Perbaikan', c: '#C9A227', bg: '#F6F0D8' },
  warning:          { label: 'Warning',         c: '#C77B3C', bg: '#F8EEE2' },
  critical:         { label: 'Critical',        c: '#B4452F', bg: '#F7E7E2' },
} as const

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarBg(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}
function getInitials(n: string) { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) }

const BREAKDOWN_LABELS: Record<string, string> = {
  task_completion_score:    'Penyelesaian Task',
  deadline_accuracy_score:  'Ketepatan Deadline',
  kpi_score:                'Pencapaian KPI',
  quality_score:            'Kualitas Kerja',
  initiative_score:         'Inisiatif',
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0
  const color = v >= 80 ? '#5E8C61' : v >= 60 ? '#C9A227' : '#C77B3C'
  return (
    <div>
      <div className="flex justify-between text-[12.5px] mb-[6px]">
        <span className="text-[#5A574C] font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{value != null ? `${v.toFixed(0)}` : '—'}</span>
      </div>
      <div className="h-[9px] bg-[#EDE7D6] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width_.4s]" style={{ width: `${Math.min(100, v)}%`, background: color }}/>
      </div>
    </div>
  )
}

export default function MyPerformancePage() {
  const { userId, isLeader, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const myScoreQ   = useMyScore(userId ?? '', rangeStart, rangeEnd)
  const allScoresQ = useProductivityScores(rangeStart, rangeEnd)

  if (authLoading || myScoreQ.isLoading) {
    return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>
  }

  const score    = myScoreQ.data
  const allScores = allScoresQ.data ?? []
  const sorted   = [...allScores].sort((a, b) => b.final_score - a.final_score)
  const myRank   = score ? sorted.findIndex(s => s.user_id === userId) + 1 : 0

  const sm = score ? (STATUS_META[score.status] ?? STATUS_META.need_improvement) : null
  const finalColor = score ? (score.final_score >= 80 ? '#5E8C61' : score.final_score >= 60 ? '#C9A227' : '#C77B3C') : '#9A9279'

  if (isLeader) {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 text-center text-[13px] text-[#9A9279]">
        Halaman ini untuk anggota tim. Gunakan Team Performance untuk lihat semua skor tim.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-[1fr_1.5fr]">
        {/* Score card */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <div className="text-[12px] text-[#9A9279] font-medium mb-2">Final Score</div>
          <div className="text-[52px] font-bold tracking-tight leading-none" style={{ color: finalColor }}>
            {score ? score.final_score.toFixed(0) : '—'}
          </div>
          <div className="text-[12px] text-[#9A9279] mb-3">/100</div>
          {sm && (
            <span className="text-[12px] font-semibold px-[12px] py-[5px] rounded-full" style={{ color: sm.c, background: sm.bg }}>
              {sm.label}
            </span>
          )}
          {myRank > 0 && (
            <div className="mt-4 pt-4 border-t border-[#F0EBDB] w-full text-[12px] text-[#9A9279]">
              Peringkat di tim · <span className="font-bold text-[#3F5A3E]">#{myRank}</span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-5">
          <h3 className="text-[13px] font-bold text-[#2B2A24] mb-4">Rincian Skor</h3>
          {!score ? (
            <p className="text-[13px] text-[#9A9279]">Belum ada data skor untuk periode ini.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
                <ScoreBar key={key} label={label}
                  value={(score as unknown as Record<string, number | null>)[key] as number | null}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Posisi di tim */}
      {sorted.length > 0 && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">
            Posisi di Tim
          </div>
          <div className="flex flex-col">
            {sorted.map((s, i) => {
              const isMe = s.user_id === userId
              const rank = i + 1
              const sc = s.status ? (STATUS_META[s.status] ?? STATUS_META.need_improvement) : null
              return (
                <div key={s.user_id}
                  className="flex items-center gap-[11px] px-4 py-[10px] border-t border-[#F1ECDC] first:border-t-0"
                  style={{ background: isMe ? '#F0F7EE' : 'transparent' }}>
                  <div className="w-[20px] text-[12px] font-bold text-[#B0A78C] text-center flex-shrink-0">
                    {rank}
                  </div>
                  <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                    style={{ background: avatarBg(s.user_name) }}>
                    {getInitials(s.user_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[#2B2A24]">
                      {s.user_name}{isMe && <span className="ml-1 text-[11px] text-[#5E8C61]">(kamu)</span>}
                    </div>
                  </div>
                  {sc && <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color: sc.c, background: sc.bg }}>{sc.label}</span>}
                  <div className="text-[14px] font-bold text-[#2B2A24] w-[40px] text-right">
                    {s.final_score.toFixed(0)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 && !myScoreQ.isLoading && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 text-center">
          <div className="text-[15px] font-bold text-[#2B2A24] mb-1">Belum ada data skor</div>
          <div className="text-[13px] text-[#9A9279]">Skor akan muncul setelah leader menjalankan kalkulasi produktivitas.</div>
        </div>
      )}
    </div>
  )
}

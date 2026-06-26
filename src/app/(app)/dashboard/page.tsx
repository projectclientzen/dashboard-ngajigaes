'use client'

import { useApp } from '@/contexts/AppContext'
import { canViewFinancial } from '@/lib/financial'
import { formatRupiah, formatNumber, formatDate, getInitials } from '@/lib/utils'
import { useTasks } from '@/lib/queries/tasks'
import { useAccountInsights } from '@/lib/queries/instagram'
import { useSalesRecords, useProductSold } from '@/lib/queries/sales'
import { useAllKpiResults } from '@/lib/queries/kpi'
import { useProductivityScores } from '@/lib/queries/productivity'
import { useDailyReports } from '@/lib/queries/daily-reports'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
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

function MetricCard({ label, value, sub, subColor }: { label:string; value:string; sub:string; subColor?:string }) {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-[15px_16px]">
      <div className="text-[12px] text-[#9A9279] font-medium mb-2">{label}</div>
      <div className="text-[25px] font-bold text-[#2B2A24] tracking-tight">{value}</div>
      <div className="text-[12px] font-semibold mt-[6px]" style={{ color: subColor ?? '#A89F86' }}>{sub}</div>
    </div>
  )
}

function Sparkline({ values, height = 190 }: { values: number[]; height?: number }) {
  if (values.length < 2) return <div style={{ height }} className="flex items-center justify-center text-[12px] text-[#A89F86]">Belum ada data</div>
  const mn = Math.min(...values), mx = Math.max(...values)
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 40 - ((v - mn) / ((mx - mn) || 1)) * 34 - 3
    return [x.toFixed(2), y.toFixed(2)]
  })
  const d = 'M ' + pts.map(p => p.join(' ')).join(' L ')
  const area = d + ' L 100 42 L 0 42 Z'
  return (
    <svg viewBox="0 0 100 42" preserveAspectRatio="none" style={{ width:'100%', height, display:'block' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7E997B" stopOpacity="0.28"/>
          <stop offset="1" stopColor="#7E997B" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={d} fill="none" stroke="#5E7A5C" strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

function SkeletonCard() {
  return <div className="bg-white border border-[#EBE5D4] rounded-lg p-[15px_16px] animate-pulse">
    <div className="h-3 bg-[#EDE7D6] rounded w-1/2 mb-3"/>
    <div className="h-7 bg-[#EDE7D6] rounded w-3/4 mb-2"/>
    <div className="h-3 bg-[#EDE7D6] rounded w-2/3"/>
  </div>
}

export default function DashboardPage() {
  const { userId, userRole, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const canFinancial = canViewFinancial(userRole)

  const tasksQ   = useTasks(canFinancial ? undefined : userId ?? undefined)
  const insightQ = useAccountInsights(rangeStart, rangeEnd)
  const salesQ   = useSalesRecords(rangeStart, rangeEnd)
  const soldQ    = useProductSold(rangeStart, rangeEnd)
  const kpiQ     = useAllKpiResults(rangeStart, rangeEnd)
  const scoresQ  = useProductivityScores(rangeStart, rangeEnd)
  const reportQ  = useDailyReports(new Date().toISOString().split('T')[0])

  const isLoading = authLoading || tasksQ.isLoading

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[14px] animate-pulse">
        <div className="grid grid-cols-4 gap-[14px]">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  const tasks   = tasksQ.data ?? []
  const insights = insightQ.data ?? []
  const sales   = salesQ.data ?? []
  const sold    = soldQ.data ?? []
  const kpiRes  = kpiQ.data ?? []
  const scores  = scoresQ.data ?? []
  const reports = reportQ.data ?? []

  // Task summary
  const activeTasks  = tasks.filter(t => t.status !== 'cancelled')
  const doneTasks    = activeTasks.filter(t => t.status === 'done').length
  const overdueTasks = tasks.filter(t => t.is_overdue).length
  const ongoingTasks = activeTasks.filter(t => ['in_progress','need_review','revision'].includes(t.status)).length
  const completionRate = activeTasks.length > 0 ? Math.round((doneTasks / activeTasks.length) * 100) : 0
  const circum = 2 * Math.PI * 38
  const dash = `${((circum * completionRate) / 100).toFixed(1)} ${circum.toFixed(1)}`

  // KPI summary
  const kpiAchs   = kpiRes.map(k => k.achievement_percentage)
  const kpiAvg    = kpiAchs.length > 0 ? Math.round(kpiAchs.reduce((a,b)=>a+b,0)/kpiAchs.length) : 0
  const kpiAchieved = kpiAchs.filter(x => x >= 100).length
  const kpiNotYet  = kpiAchs.filter(x => x < 100).length

  // IG summary
  const lastIg   = insights[insights.length - 1]
  const totalReach  = insights.reduce((a,b) => a+(b.reach??0), 0)
  const totalImpr   = insights.reduce((a,b) => a+(b.impressions??0), 0)
  const totalGrowth = insights.reduce((a,b) => a+(b.follower_growth??0), 0)
  const avgEng   = insights.length > 0
    ? (insights.reduce((a,b) => a+(b.engagement_rate??0),0)/insights.length).toFixed(1)
    : '0.0'
  const topContent = (insightQ.data ?? []).sort((a,b)=>(b.reach??0)-(a.reach??0))[0]

  // Revenue
  const totalGross  = sales.reduce((a,b) => a+b.gross_revenue, 0)
  const totalOrders = sales.reduce((a,b) => a+b.order_count, 0)
  const totalUnits  = canFinancial
    ? sales.reduce((a,b) => a+b.quantity, 0)
    : sold.reduce((a,b) => a+b.quantity, 0)
  const aov = totalOrders > 0 ? totalGross / totalOrders : 0

  const revValues = insights.map((_,i) => 1500000 + i * 120000 + Math.sin(i)*400000)
  const reachVals = insights.map(i => i.reach ?? 0)
  const reachLabels = insights.map(i => formatDate(i.insight_date, 'd MMM'))

  // Alerts
  const allUserIds = Array.from(new Set(tasks.map(t=>t.assignee_id)))
  const filledUserIds = reports.map(r => r.user_id)
  const missingCount = Math.max(0, allUserIds.length - filledUserIds.length)

  const alerts = [
    { text:'Task overdue belum diselesaikan', count:overdueTasks, dot:'#B4452F', bg:'#FBF1EE', border:'#F0DDD6' },
    { text:'Anggota belum isi daily report', count:missingCount, dot:'#C77B3C', bg:'#FBF4EC', border:'#EFE2D2' },
    { text:'KPI di bawah target', count:kpiNotYet, dot:'#B58A1E', bg:'#FAF6E8', border:'#EDE5CC' },
    { text:'Konten low performance', count:0, dot:'#4F7CAC', bg:'#EFF4F9', border:'#DCE7F0' },
  ]

  return (
    <div className="flex flex-col gap-[14px] animate-fade-up">

      {/* Row 1: metrics */}
      <div className="grid grid-cols-4 gap-[14px]">
        {canFinancial ? (
          <>
            <MetricCard label="Omzet" value={formatRupiah(totalGross, true)} sub={`${formatNumber(totalOrders)} order`} />
            <MetricCard label="Order" value={formatNumber(totalOrders)} sub={`${formatNumber(totalUnits)} unit terjual`} />
            <MetricCard label="AOV" value={formatRupiah(aov, true)} sub="rata-rata per order" />
            <MetricCard label="Growth" value="+—%" sub="vs periode lalu" subColor="#9A9279" />
          </>
        ) : (
          <>
            <MetricCard label="Produk Terjual" value={formatNumber(totalUnits)} sub="unit" />
            <MetricCard label="Total Order" value={formatNumber(sold.reduce((a,b)=>a+b.order_count,0))} sub="order" />
            <MetricCard label="Task Selesai" value={`${doneTasks}`} sub={`dari ${activeTasks.length} task`} />
            <MetricCard label="KPI Achievement" value={`${kpiAvg}%`} sub="rata-rata" />
          </>
        )}
      </div>

      {/* Row 2: task + kpi + ig */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1.1fr 1fr 1.2fr' }}>
        {/* Task ring */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Penyelesaian Task</div>
          {activeTasks.length === 0 ? (
            <div className="text-[13px] text-[#A89F86] text-center py-4">Belum ada task</div>
          ) : (
            <div className="flex items-center gap-[18px]">
              <div className="relative w-[88px] h-[88px] flex-shrink-0">
                <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform:'rotate(-90deg)' }}>
                  <circle cx="44" cy="44" r="38" fill="none" stroke="#EDE7D6" strokeWidth="9"/>
                  <circle cx="44" cy="44" r="38" fill="none" stroke="#5E8C61" strokeWidth="9" strokeLinecap="round" strokeDasharray={dash}/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[20px] font-bold text-[#2B2A24]">{completionRate}%</div>
                  <div className="text-[10px] text-[#A89F86]">selesai</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-[7px]">
                {[
                  { label:'Total task', val:activeTasks.length, color:'#2B2A24' },
                  { label:'Selesai', val:doneTasks, color:'#5E8C61' },
                  { label:'Berjalan', val:ongoingTasks, color:'#4F7CAC' },
                  { label:'Overdue', val:overdueTasks, color:'#B4452F' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-[12px]">
                    <span className="text-[#7A766B]">{r.label}</span>
                    <span className="font-semibold" style={{ color:r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KPI */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Ringkasan KPI</div>
          {kpiRes.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada data KPI periode ini.</div>
          ) : (
            <>
              <div className="text-[30px] font-bold text-[#2B2A24] tracking-tight">{kpiAvg}%</div>
              <div className="text-[11px] text-[#A89F86] mb-[14px]">rata-rata achievement</div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { label:'KPI tercapai', val:kpiAchieved, color:'#5E8C61' },
                  { label:'Belum tercapai', val:kpiNotYet, color:'#C77B3C' },
                  { label:'Tertinggi', val:`${kpiAchs.length>0?Math.round(Math.max(...kpiAchs)):0}%`, color:'#2B2A24' },
                  { label:'Terendah', val:`${kpiAchs.length>0?Math.round(Math.min(...kpiAchs)):0}%`, color:'#2B2A24' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-[12px]">
                    <span className="text-[#7A766B]">{r.label}</span>
                    <span className="font-semibold" style={{ color:r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Instagram */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-[13px] font-bold text-[#2B2A24]">Instagram</div>
            {totalGrowth > 0 && (
              <div className="text-[11px] font-semibold text-[#5E8C61] bg-[#E9F1E6] px-2 py-0.5 rounded-full">
                +{formatNumber(totalGrowth)} follower
              </div>
            )}
          </div>
          {insights.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada data insight.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-[10px] gap-y-3">
                {[
                  { val: lastIg ? formatNumber(lastIg.followers??0) : '—', label:'followers' },
                  { val: totalReach>0 ? `${(totalReach/1000).toFixed(1)}rb` : '—', label:'reach' },
                  { val: `${avgEng}%`, label:'engagement' },
                  { val: totalImpr>0 ? `${(totalImpr/1000).toFixed(1)}rb` : '—', label:'impresi' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-[18px] font-bold text-[#2B2A24]">{item.val}</div>
                    <div className="text-[11px] text-[#A89F86]">{item.label}</div>
                  </div>
                ))}
              </div>
              {topContent && (
                <div className="mt-[13px] pt-[11px] border-t border-[#F0EBDB] text-[11px] text-[#9A9279]">
                  Top: <span className="text-[#3F5A3E] font-semibold">{topContent.insight_date}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1.7fr 1fr' }}>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-[6px]">
            <div className="text-[13px] font-bold text-[#2B2A24]">{canFinancial ? 'Tren Omzet' : 'Tren Produk Terjual'}</div>
            <div className="text-[11px] text-[#A89F86]">30 hari terakhir</div>
          </div>
          <Sparkline values={revValues} height={190} />
        </div>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Reach Instagram</div>
          {reachVals.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center text-[12px] text-[#A89F86]">Belum ada data</div>
          ) : (
            <div className="flex items-end gap-2 h-[150px]">
              {reachVals.map((v, i) => {
                const mx = Math.max(...reachVals, 1)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-[6px] h-full justify-end">
                    <div className="w-full rounded-t" style={{ height:`${Math.max(6,(v/mx)*100)}%`, background:'linear-gradient(180deg,#8FA98C,#7E997B)' }}/>
                    <div className="text-[9px] text-[#B0A78C]">{reachLabels[i]}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Ranking + Alerts */}
      <div className="grid grid-cols-2 gap-[14px]">
        {canFinancial ? (
          <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
            <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Ranking Tim</div>
            {scores.length === 0 ? (
              <div className="text-[13px] text-[#A89F86]">Belum ada data score periode ini.</div>
            ) : (
              <div className="flex flex-col gap-[3px]">
                {scores.map((sc, i) => {
                  const sm = statusMeta(sc.status)
                  return (
                    <div key={sc.user_id} className="flex items-center gap-[11px] py-2 px-1 border-b border-[#F4EFDF]">
                      <div className="w-5 text-[12px] font-bold text-[#B0A78C] text-center">{i+1}</div>
                      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[11px] font-semibold text-white"
                        style={{ background: avatarColor(sc.user_name) }}>
                        {getInitials(sc.user_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#2B2A24] truncate">{sc.user_name}</div>
                      </div>
                      <div className="text-[12px] font-bold text-[#2B2A24]">{sc.final_score}</div>
                      <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color:sm.c, background:sm.bg }}>{sm.t}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
            <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Task Saya</div>
            <div className="flex flex-col gap-[7px]">
              {[
                { label:'Total', val:activeTasks.length, color:'#2B2A24' },
                { label:'Selesai', val:doneTasks, color:'#5E8C61' },
                { label:'Sedang dikerjakan', val:ongoingTasks, color:'#4F7CAC' },
                { label:'Overdue', val:overdueTasks, color:'#B4452F' },
                { label:'Completion rate', val:`${completionRate}%`, color:'#2B2A24' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[12px]">
                  <span className="text-[#7A766B]">{r.label}</span>
                  <span className="font-semibold" style={{ color:r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Perlu Perhatian</div>
          {alerts.filter(a => a.count > 0).length === 0 ? (
            <div className="text-[13px] text-[#5E8C61] font-medium">✓ Semua baik-baik saja!</div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.filter(a => a.count > 0).map((a, i) => (
                <div key={i} className="flex items-center gap-[11px] px-3 py-[10px] rounded-[7px] border"
                  style={{ background:a.bg, borderColor:a.border }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:a.dot }}/>
                  <div className="flex-1 text-[12px] text-[#3F3D34] font-medium">{a.text}</div>
                  <div className="text-[12px] font-bold" style={{ color:a.dot }}>{a.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

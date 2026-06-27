'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { canViewFinancial } from '@/lib/financial'
import { formatRupiah, formatNumber, formatDate, getInitials } from '@/lib/utils'
import { useTasks } from '@/lib/queries/tasks'
import { useAccountInsights } from '@/lib/queries/instagram'
import { useSalesRecords, useProductSold } from '@/lib/queries/sales'
import { useAllKpiResults, useKpiResults } from '@/lib/queries/kpi'
import { useProductivityScores, useMyScore } from '@/lib/queries/productivity'
import { useDailyReports } from '@/lib/queries/daily-reports'
import { useExtraTasks } from '@/lib/queries/extra-tasks'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

const STATUS_META: Record<string, { t: string; c: string; bg: string }> = {
  excellent:        { t:'Excellent',       c:'#5E8C61', bg:'#E9F1E6' },
  good:             { t:'Good',            c:'#4F7CAC', bg:'#E8F0F6' },
  need_improvement: { t:'Perlu Perbaikan', c:'#B58A1E', bg:'#F6EFD8' },
  warning:          { t:'Warning',         c:'#C77B3C', bg:'#F8EEE2' },
  critical:         { t:'Critical',        c:'#B4452F', bg:'#F7E7E2' },
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
          <stop offset="0" stopColor="#7E997B" stopOpacity="0.28"/><stop offset="1" stopColor="#7E997B" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={d} fill="none" stroke="#5E7A5C" strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

function TaskRing({ rate, circum, dash }: { rate: number; circum: number; dash: string }) {
  return (
    <div className="relative w-[88px] h-[88px] flex-shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r="38" fill="none" stroke="#EDE7D6" strokeWidth="9"/>
        <circle cx="44" cy="44" r="38" fill="none" stroke="#5E8C61" strokeWidth="9" strokeLinecap="round" strokeDasharray={dash}/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[20px] font-bold text-[#2B2A24]">{rate}%</div>
        <div className="text-[10px] text-[#A89F86]">selesai</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  LEADER DASHBOARD
// ══════════════════════════════════════════════════════════
function LeaderDashboard() {
  const { userRole, rangeStart, rangeEnd } = useApp()
  const canFinancial = canViewFinancial(userRole)

  const tasksQ   = useTasks()
  const insightQ = useAccountInsights(rangeStart, rangeEnd)
  const salesQ   = useSalesRecords(rangeStart, rangeEnd)
  const soldQ    = useProductSold(rangeStart, rangeEnd)
  const kpiQ     = useAllKpiResults(rangeStart, rangeEnd)
  const scoresQ  = useProductivityScores(rangeStart, rangeEnd)
  const reportQ  = useDailyReports(new Date().toISOString().split('T')[0])

  const tasks    = tasksQ.data ?? []
  const insights = insightQ.data ?? []
  const sales    = salesQ.data ?? []
  const sold     = soldQ.data ?? []
  const kpiRes   = kpiQ.data ?? []
  const scores   = scoresQ.data ?? []
  const reports  = reportQ.data ?? []

  const activeTasks    = tasks.filter(t => t.status !== 'cancelled')
  const doneTasks      = activeTasks.filter(t => t.status === 'done').length
  const overdueTasks   = tasks.filter(t => t.is_overdue).length
  const ongoingTasks   = activeTasks.filter(t => ['in_progress','need_review','revision'].includes(t.status)).length
  const completionRate = activeTasks.length > 0 ? Math.round((doneTasks / activeTasks.length) * 100) : 0
  const circum = 2 * Math.PI * 38
  const dash   = `${((circum * completionRate) / 100).toFixed(1)} ${circum.toFixed(1)}`

  const kpiAchs     = kpiRes.map(k => k.achievement_percentage)
  const kpiAvg      = kpiAchs.length > 0 ? Math.round(kpiAchs.reduce((a,b)=>a+b,0)/kpiAchs.length) : 0
  const kpiAchieved = kpiAchs.filter(x => x >= 100).length
  const kpiNotYet   = kpiAchs.filter(x => x < 100).length

  const lastIg      = insights[insights.length - 1]
  const totalReach  = insights.reduce((a,b) => a+(b.reach??0), 0)
  const totalImpr   = insights.reduce((a,b) => a+(b.impressions??0), 0)
  const totalGrowth = insights.reduce((a,b) => a+(b.follower_growth??0), 0)
  const avgEng      = insights.length > 0 ? (insights.reduce((a,b) => a+(b.engagement_rate??0),0)/insights.length*100).toFixed(1) : '0.0'

  const totalGross  = sales.reduce((a,b) => a+b.gross_revenue, 0)
  const totalOrders = sales.reduce((a,b) => a+b.order_count, 0)
  const totalUnits  = canFinancial ? sales.reduce((a,b) => a+b.quantity, 0) : sold.reduce((a,b) => a+b.quantity, 0)
  const aov         = totalOrders > 0 ? totalGross / totalOrders : 0

  const reachVals   = insights.map(i => i.reach ?? 0)
  const reachLabels = insights.map(i => formatDate(i.insight_date, 'd MMM'))

  const allUserIds   = Array.from(new Set(tasks.map(t=>t.assignee_id)))
  const filledIds    = reports.map(r => r.user_id)
  const missingCount = Math.max(0, allUserIds.length - filledIds.length)

  const alerts = [
    { text:'Task overdue',              count:overdueTasks,  dot:'#B4452F', bg:'#FBF1EE', border:'#F0DDD6' },
    { text:'Belum isi daily report',    count:missingCount,  dot:'#C77B3C', bg:'#FBF4EC', border:'#EFE2D2' },
    { text:'KPI di bawah target',       count:kpiNotYet,     dot:'#B58A1E', bg:'#FAF6E8', border:'#EDE5CC' },
  ].filter(a => a.count > 0)

  return (
    <div className="flex flex-col gap-[14px]">
      {/* Row 1 */}
      <div className="grid grid-cols-4 gap-[14px]">
        {canFinancial ? (
          <>
            <MetricCard label="Omzet" value={formatRupiah(totalGross, true)} sub={`${formatNumber(totalOrders)} order`}/>
            <MetricCard label="Order" value={formatNumber(totalOrders)} sub={`${formatNumber(totalUnits)} unit terjual`}/>
            <MetricCard label="AOV" value={formatRupiah(aov, true)} sub="rata-rata per order"/>
            <MetricCard label="Growth" value="+—%" sub="vs periode lalu" subColor="#9A9279"/>
          </>
        ) : (
          <>
            <MetricCard label="Produk Terjual" value={formatNumber(totalUnits)} sub="unit"/>
            <MetricCard label="Total Order" value={formatNumber(sold.reduce((a,b)=>a+b.order_count,0))} sub="order"/>
            <MetricCard label="Task Selesai" value={String(doneTasks)} sub={`dari ${activeTasks.length} task`}/>
            <MetricCard label="KPI Achievement" value={`${kpiAvg}%`} sub="rata-rata"/>
          </>
        )}
      </div>

      {/* Row 2 */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1.1fr 1fr 1.2fr' }}>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Penyelesaian Task</div>
          {activeTasks.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada task</div>
          ) : (
            <div className="flex items-center gap-[18px]">
              <TaskRing rate={completionRate} circum={circum} dash={dash}/>
              <div className="flex-1 flex flex-col gap-[7px]">
                {[{label:'Total task',val:activeTasks.length,color:'#2B2A24'},{label:'Selesai',val:doneTasks,color:'#5E8C61'},{label:'Berjalan',val:ongoingTasks,color:'#4F7CAC'},{label:'Overdue',val:overdueTasks,color:'#B4452F'}].map(r => (
                  <div key={r.label} className="flex justify-between text-[12px]">
                    <span className="text-[#7A766B]">{r.label}</span>
                    <span className="font-semibold" style={{ color:r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Ringkasan KPI</div>
          {kpiRes.length === 0 ? <div className="text-[13px] text-[#A89F86]">Belum ada data KPI.</div> : (
            <>
              <div className="text-[30px] font-bold text-[#2B2A24] tracking-tight">{kpiAvg}%</div>
              <div className="text-[11px] text-[#A89F86] mb-[14px]">rata-rata achievement</div>
              <div className="flex flex-col gap-[7px]">
                {[{label:'Tercapai',val:kpiAchieved,color:'#5E8C61'},{label:'Belum',val:kpiNotYet,color:'#C77B3C'},{label:'Tertinggi',val:`${kpiAchs.length?Math.round(Math.max(...kpiAchs)):0}%`,color:'#2B2A24'},{label:'Terendah',val:`${kpiAchs.length?Math.round(Math.min(...kpiAchs)):0}%`,color:'#2B2A24'}].map(r=>(
                  <div key={r.label} className="flex justify-between text-[12px]">
                    <span className="text-[#7A766B]">{r.label}</span>
                    <span className="font-semibold" style={{ color:r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-[13px] font-bold text-[#2B2A24]">Instagram</div>
            {totalGrowth > 0 && <div className="text-[11px] font-semibold text-[#5E8C61] bg-[#E9F1E6] px-2 py-0.5 rounded-full">+{formatNumber(totalGrowth)} follower</div>}
          </div>
          {insights.length === 0 ? <div className="text-[13px] text-[#A89F86]">Belum ada data insight.</div> : (
            <div className="grid grid-cols-2 gap-x-[10px] gap-y-3">
              {[{val:lastIg?formatNumber(lastIg.followers??0):'—',label:'followers'},{val:totalReach>0?`${(totalReach/1000).toFixed(1)}rb`:'—',label:'reach'},{val:`${avgEng}%`,label:'engagement'},{val:totalImpr>0?`${(totalImpr/1000).toFixed(1)}rb`:'—',label:'impresi'}].map(item=>(
                <div key={item.label}>
                  <div className="text-[18px] font-bold text-[#2B2A24]">{item.val}</div>
                  <div className="text-[11px] text-[#A89F86]">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Charts */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1.7fr 1fr' }}>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-[6px]">
            <div className="text-[13px] font-bold text-[#2B2A24]">Tren Omzet</div>
            <div className="text-[11px] text-[#A89F86]">30 hari terakhir</div>
          </div>
          <Sparkline values={sales.map(s => s.net_revenue)} height={190}/>
        </div>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Reach Instagram</div>
          {reachVals.length === 0 ? <div className="h-[150px] flex items-center justify-center text-[12px] text-[#A89F86]">Belum ada data</div> : (
            <div className="flex items-end gap-2 h-[150px]">
              {reachVals.map((v, i) => {
                const mx = Math.max(...reachVals, 1)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-[6px] h-full justify-end">
                    <div className="w-full rounded-t" style={{ height:`${Math.max(6,(v/mx)*100)}%`, background:'linear-gradient(180deg,#8FA98C,#7E997B)'}}/>
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
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Ranking Tim</div>
          {scores.length === 0 ? <div className="text-[13px] text-[#A89F86]">Belum ada data score periode ini.<br/><span className="text-[11px]">Jalankan close_weekly_review untuk generate snapshot.</span></div> : (
            <div className="flex flex-col gap-[3px]">
              {scores.map((sc, i) => {
                const sm = STATUS_META[sc.status] ?? STATUS_META.critical
                return (
                  <div key={sc.user_id} className="flex items-center gap-[11px] py-2 px-1 border-b border-[#F4EFDF]">
                    <div className="w-5 text-[12px] font-bold text-[#B0A78C] text-center">{i+1}</div>
                    <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: avatarColor(sc.user_name) }}>{getInitials(sc.user_name)}</div>
                    <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-[#2B2A24] truncate">{sc.user_name}</div></div>
                    <div className="text-[12px] font-bold text-[#2B2A24]">{sc.final_score.toFixed(0)}</div>
                    <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color:sm.c, background:sm.bg }}>{sm.t}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Perlu Perhatian</div>
          {alerts.length === 0 ? (
            <div className="text-[13px] text-[#5E8C61] font-medium">✓ Semua baik-baik saja!</div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-[11px] px-3 py-[10px] rounded-[7px] border" style={{ background:a.bg, borderColor:a.border }}>
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

// ══════════════════════════════════════════════════════════
//  MEMBER DASHBOARD
// ══════════════════════════════════════════════════════════
function MemberDashboard() {
  const { userId, userName, userRole, rangeStart, rangeEnd } = useApp()

  const tasksQ   = useTasks(userId ?? undefined)
  const myScoreQ = useMyScore(userId ?? '', rangeStart, rangeEnd)
  const insightQ = useAccountInsights(rangeStart, rangeEnd)
  const kpiQ     = useKpiResults(userId ?? '', rangeStart, rangeEnd)
  const extraQ   = useExtraTasks(userId ?? undefined)
  const reportQ  = useDailyReports(new Date().toISOString().split('T')[0])

  const tasks    = tasksQ.data ?? []
  const myScore  = myScoreQ.data
  const insights = insightQ.data ?? []
  const kpiRes   = kpiQ.data ?? []
  const extras   = extraQ.data ?? []
  const reports  = reportQ.data ?? []

  const activeTasks    = tasks.filter(t => t.status !== 'cancelled')
  const doneTasks      = activeTasks.filter(t => t.status === 'done').length
  const overdueTasks   = tasks.filter(t => t.is_overdue).length
  const ongoingTasks   = activeTasks.filter(t => ['in_progress','need_review','revision'].includes(t.status)).length
  const completionRate = activeTasks.length > 0 ? Math.round((doneTasks / activeTasks.length) * 100) : 0
  const circum = 2 * Math.PI * 38
  const dash   = `${((circum * completionRate) / 100).toFixed(1)} ${circum.toFixed(1)}`

  const kpiAvg      = kpiRes.length > 0 ? Math.round(kpiRes.reduce((a,k)=>a+(k.achievement_percentage),0)/kpiRes.length) : 0
  const kpiAchieved = kpiRes.filter(k => k.achievement_percentage >= 100).length

  const todayFilled = reports.some(r => r.user_id === userId)

  const lastIg   = insights[insights.length - 1]
  const avgEng   = insights.length > 0 ? (insights.reduce((a,b)=>a+(b.engagement_rate??0),0)/insights.length*100).toFixed(1) : '0.0'
  const totalGrowth = insights.reduce((a,b)=>a+(b.follower_growth??0),0)

  const finalScore = myScore?.final_score ?? null
  const scoreColor = finalScore != null ? (finalScore >= 80 ? '#5E8C61' : finalScore >= 60 ? '#C9A227' : '#C77B3C') : '#9A9279'
  const sm = myScore ? (STATUS_META[myScore.status] ?? STATUS_META.need_improvement) : null

  const activeSorted = [...activeTasks.filter(t => t.status !== 'done')].slice(0, 5)

  const extraPend = extras.filter(e => e.status === 'pending').length
  const extraProg = extras.filter(e => e.status === 'in_progress').length

  return (
    <div className="flex flex-col gap-[14px]">

      {/* Score card banner */}
      <div className="rounded-xl p-4 flex items-center gap-4" style={{ background:'linear-gradient(135deg,#5E7A5C,#6E8C6B)', color:'#FCF8EC' }}>
        <div className="w-[44px] h-[44px] rounded-[11px] flex items-center justify-center text-[14px] font-bold flex-shrink-0"
          style={{ background:'rgba(255,255,255,.18)' }}>
          {getInitials(userName ?? 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold tracking-tight">{userName ?? 'Anggota Tim'}</div>
          <div className="text-[12px] opacity-85">{userRole.replace('_',' ')}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[26px] font-bold tracking-tight" style={{ color: finalScore != null ? '#FCF8EC' : 'rgba(255,255,255,.5)' }}>
            {finalScore != null ? finalScore.toFixed(0) : '—'}
          </div>
          <div className="text-[10px] opacity-80">final score</div>
        </div>
        {sm && (
          <span className="text-[11px] font-semibold px-[10px] py-[4px] rounded-full flex-shrink-0"
            style={{ color: sm.c, background: sm.bg }}>
            {sm.t}
          </span>
        )}
      </div>

      {/* Daily report banner */}
      {todayFilled ? (
        <div className="flex items-center gap-3 px-4 py-[11px] rounded-lg border" style={{ background:'#EEF4EA', borderColor:'#D8E6D2' }}>
          <span className="text-[14px] font-bold text-[#5E8C61]">✓</span>
          <span className="text-[13px] text-[#3F5A3E] font-medium">Daily report hari ini sudah terkirim. Mantap!</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-[11px] rounded-lg border" style={{ background:'#FBF4EC', borderColor:'#EFE2D2' }}>
          <span className="w-[9px] h-[9px] rounded-full bg-[#C77B3C] flex-shrink-0"/>
          <span className="flex-1 text-[13px] text-[#7A5A38] font-medium">Kamu belum mengisi daily report hari ini.</span>
          <Link href="/daily-reports" className="text-white text-[12px] font-semibold px-[14px] py-[6px] rounded-md no-underline"
            style={{ background:'#C77B3C' }}>
            Isi sekarang
          </Link>
        </div>
      )}

      {/* 4 metric cards */}
      <div className="grid grid-cols-4 gap-[14px]">
        <MetricCard label="Tugas Saya" value={`${completionRate}%`} sub={`${doneTasks}/${activeTasks.length} selesai`}
          subColor={completionRate >= 80 ? '#5E8C61' : completionRate >= 50 ? '#C9A227' : '#C77B3C'}/>
        <MetricCard label="KPI Saya" value={`${kpiAvg}%`} sub={`${kpiAchieved}/${kpiRes.length} tercapai`}
          subColor={kpiAvg >= 100 ? '#5E8C61' : kpiAvg >= 80 ? '#4F7CAC' : '#C77B3C'}/>
        <MetricCard label="Skor Produktivitas" value={finalScore != null ? finalScore.toFixed(0) : '—'}
          sub={sm?.t ?? 'Belum dikalkulasi'} subColor={sm ? sm.c : '#9A9279'}/>
        <MetricCard label="Sedang Berjalan" value={String(ongoingTasks)}
          sub={`${overdueTasks} overdue`} subColor={overdueTasks > 0 ? '#B4452F' : '#A89F86'}/>
      </div>

      {/* Row: IG monitoring + active tasks */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1fr 1.5fr' }}>
        {/* IG monitoring */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-[14px]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#8A6BA8,#C77B3C)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff"/></svg>
              </div>
              <div className="text-[13px] font-bold text-[#2B2A24]">Monitoring Instagram</div>
            </div>
            {totalGrowth !== 0 && (
              <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full"
                style={{ color: totalGrowth > 0 ? '#5E8C61' : '#B4452F', background: totalGrowth > 0 ? '#E9F1E6' : '#F7E7E2' }}>
                {totalGrowth > 0 ? '+' : ''}{formatNumber(totalGrowth)}
              </span>
            )}
          </div>
          {insights.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada data insight.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 mb-4">
                {[
                  { val: lastIg?.followers != null ? formatNumber(lastIg.followers) : '—', label:'Followers' },
                  { val: lastIg?.reach != null ? formatNumber(lastIg.reach) : '—', label:'Reach' },
                  { val: `${avgEng}%`, label:'Engagement' },
                  { val: lastIg?.impressions != null ? formatNumber(lastIg.impressions) : '—', label:'Impresi' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-[17px] font-bold text-[#2B2A24]">{item.val}</div>
                    <div className="text-[10px] text-[#A89F86] mt-[2px]">{item.label}</div>
                  </div>
                ))}
              </div>
              {insights.length > 1 && (
                <div className="flex items-end gap-[4px] h-[60px]">
                  {insights.slice(-7).map((ins, i) => {
                    const vals = insights.slice(-7).map(x => x.reach ?? 0)
                    const mx = Math.max(...vals, 1)
                    const v = ins.reach ?? 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-[4px] h-full justify-end">
                        <div className="w-full rounded-t" style={{ height:`${Math.max(4,(v/mx)*100)}%`, background:'linear-gradient(180deg,#8FA98C,#7E997B)'}}/>
                        <div className="text-[8px] text-[#B0A78C]">{formatDate(ins.insight_date, 'd/M')}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Active tasks */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-bold text-[#2B2A24]">Tugas Aktif Saya</div>
            <Link href="/tasks" className="text-[11px] text-[#4F7CAC] font-semibold no-underline hover:underline">Lihat semua →</Link>
          </div>
          {activeSorted.length === 0 ? (
            <div className="py-6 text-center text-[13px] text-[#A89F86]">Tidak ada tugas aktif.</div>
          ) : (
            <div className="flex flex-col gap-[8px]">
              {activeSorted.map(t => {
                const statusColors: Record<string, string> = { in_progress:'#4F7CAC', need_review:'#8A6BA8', revision:'#C77B3C', todo:'#6E6B5F', backlog:'#9A9279', blocked:'#B4452F' }
                const sc = statusColors[t.status] ?? '#9A9279'
                return (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-[10px] rounded-lg border border-[#EBE5D4] bg-[#FCFAF2]">
                    <span className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: sc }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#2B2A24] truncate">{t.title}</div>
                      <div className="text-[11px] text-[#A89F86]">{t.category} · {t.deadline ? formatDate(t.deadline, 'd MMM') : 'Tanpa deadline'}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-[8px] py-[3px] rounded-full flex-shrink-0"
                      style={{ color: sc, background: sc + '1A' }}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row: Task ring + KPI bars + Tugas Tambahan */}
      <div className="grid gap-[14px]" style={{ gridTemplateColumns:'1fr 1.25fr 1fr' }}>
        {/* Task ring */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-4">Penyelesaian Tugas</div>
          <div className="flex items-center gap-4">
            <TaskRing rate={completionRate} circum={circum} dash={dash}/>
            <div className="flex-1 flex flex-col gap-[7px]">
              {[{label:'Selesai',val:doneTasks,c:'#5E8C61'},{label:'Berjalan',val:ongoingTasks,c:'#4F7CAC'},{label:'Overdue',val:overdueTasks,c:'#B4452F'}].map(r=>(
                <div key={r.label} className="flex justify-between text-[12px]">
                  <span className="text-[#7A766B]">{r.label}</span>
                  <span className="font-bold" style={{ color:r.c }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI bars */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-4">Capaian KPI Saya</div>
          {kpiRes.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada KPI yang di-assign untuk periode ini.</div>
          ) : (
            <div className="flex flex-col gap-[12px]">
              {kpiRes.slice(0, 4).map(k => {
                const pct = Math.min(100, Math.round(k.achievement_percentage))
                const color = pct >= 100 ? '#5E8C61' : pct >= 80 ? '#C9A227' : '#C77B3C'
                return (
                  <div key={k.kpi_id}>
                    <div className="flex justify-between text-[12px] mb-[5px]">
                      <span className="text-[#5A574C] font-medium truncate max-w-[160px]">{k.kpi_name}</span>
                      <span className="font-bold" style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-[8px] bg-[#EDE7D6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background: color }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tugas Tambahan */}
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-bold text-[#2B2A24]">Tugas Tambahan</div>
            <Link href="/extra-tasks" className="text-[11px] text-[#4F7CAC] font-semibold no-underline hover:underline">Lihat semua →</Link>
          </div>
          {extras.length === 0 ? (
            <div className="text-[13px] text-[#A89F86]">Belum ada tugas tambahan dari leader.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 text-center">
                  <div className="text-[18px] font-bold text-[#4F7CAC]">{extraProg}</div>
                  <div className="text-[10px] text-[#9A9279]">Progress</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-[18px] font-bold text-[#C77B3C]">{extraPend}</div>
                  <div className="text-[10px] text-[#9A9279]">Pending</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-[18px] font-bold text-[#5E8C61]">{extras.filter(e=>e.status==='done').length}</div>
                  <div className="text-[10px] text-[#9A9279]">Done</div>
                </div>
              </div>
              {extras.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-2 py-[7px] border-t border-[#F1ECDC]">
                  <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{
                    background: e.status==='done'?'#5E8C61':e.status==='in_progress'?'#4F7CAC':'#C77B3C'
                  }}/>
                  <span className="text-[12px] text-[#3F3D34] font-medium flex-1 truncate">{e.title}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  PAGE ENTRY
// ══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { isLeader, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[14px] animate-pulse">
        <div className="grid grid-cols-4 gap-[14px]">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="bg-white border border-[#EBE5D4] rounded-lg p-[15px_16px] h-[88px]">
              <div className="h-3 bg-[#EDE7D6] rounded w-1/2 mb-3"/>
              <div className="h-7 bg-[#EDE7D6] rounded w-3/4 mb-2"/>
              <div className="h-3 bg-[#EDE7D6] rounded w-2/3"/>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return isLeader ? <LeaderDashboard /> : <MemberDashboard />
}

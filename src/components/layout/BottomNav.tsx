'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

// ─── Icons ─────────────────────────────────────────────────
const IC = {
  home:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  tasks:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>,
  kpi:       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>,
  calendar:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  perf:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  more:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>,
  // drawer icons
  daily:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  team:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 5"/><path d="M21 20c0-2-1.4-3.6-3.5-4.3"/></svg>,
  extra:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M12 11v6M9 14h6"/></svg>,
  instagram: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
  sales:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/></svg>,
  review:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l2 2 4-4"/></svg>,
  settings:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 2H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L8 22h8l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>,
  logout:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// ─── Leader "More" drawer items ─────────────────────────────
const LEADER_MORE = [
  { href: '/daily-reports',    label: 'Daily Report',      icon: IC.daily },
  { href: '/team-performance', label: 'Team Performance',  icon: IC.team },
  { href: '/extra-tasks',      label: 'Tugas Tambahan',    icon: IC.extra },
  { href: '/instagram-insight',label: 'Instagram Insight', icon: IC.instagram },
  { href: '/sales',            label: 'Omzet & Produk',    icon: IC.sales },
  { href: '/weekly-review',    label: 'Weekly Review',     icon: IC.review },
  { href: '/settings',         label: 'Settings',          icon: IC.settings },
]

// ─── Tab button ─────────────────────────────────────────────
function TabBtn({
  href, label, icon, active, onClick,
}: {
  href?: string; label: string; icon: React.ReactNode; active: boolean; onClick?: () => void
}) {
  const cls = cn(
    'flex flex-col items-center gap-[3px] px-2 py-[6px] flex-1 transition-colors',
    active ? 'text-[#3F5A3E]' : 'text-[#9A9279]'
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        <span className="text-[10px] font-semibold leading-none">{label}</span>
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {icon}
      <span className="text-[10px] font-semibold leading-none">{label}</span>
    </button>
  )
}

// ─── More drawer ────────────────────────────────────────────
function MoreDrawer({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}/>
      )}
      <div className={cn(
        'fixed bottom-[56px] left-0 right-0 z-50 bg-[#FCF8EC] border-t border-[#E7E0CC] rounded-t-2xl shadow-2xl transition-transform duration-300',
        open ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="w-10 h-1 bg-[#E3DCC8] rounded-full mx-auto mt-3 mb-2"/>
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          {LEADER_MORE.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  'flex flex-col items-center gap-[6px] p-3 rounded-xl text-[11px] font-semibold transition-colors',
                  active ? 'bg-[#E5EDDF] text-[#3F5A3E]' : 'text-[#6E6B5F] hover:bg-[#EEE9D8]'
                )}>
                {item.icon}
                <span className="text-center leading-[1.2]">{item.label}</span>
              </Link>
            )
          })}
          <button onClick={onLogout}
            className="flex flex-col items-center gap-[6px] p-3 rounded-xl text-[11px] font-semibold text-[#B4452F] hover:bg-[#F7E7E2] transition-colors">
            {IC.logout}
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main ───────────────────────────────────────────────────
export function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const qc       = useQueryClient()
  const { isLeader } = useApp()
  const [moreOpen, setMoreOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    qc.clear()
    router.push('/login')
  }

  // Leader tabs: Beranda, Tasks, KPI, Calendar, More
  if (isLeader) {
    const MORE_ACTIVE = LEADER_MORE.some(m => pathname === m.href)
    return (
      <>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FCF8EC] border-t border-[#E7E0CC] flex items-stretch"
          style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <TabBtn href="/dashboard"       label="Beranda"  icon={IC.home}     active={pathname === '/dashboard'} />
          <TabBtn href="/tasks"           label="Tasks"    icon={IC.tasks}    active={pathname === '/tasks'} />
          <TabBtn href="/kpi"             label="KPI"      icon={IC.kpi}      active={pathname === '/kpi'} />
          <TabBtn href="/content-calendar" label="Konten"  icon={IC.calendar} active={pathname === '/content-calendar'} />
          <TabBtn label="Lainnya" icon={IC.more} active={MORE_ACTIVE || moreOpen} onClick={() => setMoreOpen(o => !o)} />
        </nav>
        <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} onLogout={handleLogout} />
      </>
    )
  }

  // Member tabs: Beranda, Tugas, Performa, Konten
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FCF8EC] border-t border-[#E7E0CC] flex items-stretch"
      style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <TabBtn href="/dashboard"        label="Beranda"  icon={IC.home}     active={pathname === '/dashboard'} />
      <TabBtn href="/tasks"            label="Tugas"    icon={IC.tasks}    active={pathname === '/tasks'} />
      <TabBtn href="/my-performance"   label="Performa" icon={IC.perf}     active={pathname === '/my-performance'} />
      <TabBtn href="/content-calendar" label="Konten"   icon={IC.calendar} active={pathname === '/content-calendar'} />
    </nav>
  )
}

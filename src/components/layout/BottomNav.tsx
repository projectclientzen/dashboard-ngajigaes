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
  home:      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  tasks:     <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>,
  daily:     <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  kpi:       <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>,
  more:      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>,
}

// ─── More drawer icon helpers ───────────────────────────────
function DrawerIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, JSX.Element> = {
    team:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 5"/><path d="M21 20c0-2-1.4-3.6-3.5-4.3"/></svg>,
    calendar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
    insight:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={color}/></svg>,
    sales:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/></svg>,
    review:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l2 2 4-4"/></svg>,
    settings: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 2H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L8 22h8l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>,
    extra:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M12 11v6M9 14h6"/></svg>,
    perf:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
    logout:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  }
  return <span className="flex">{icons[name] ?? null}</span>
}

// ─── More drawer items per role ─────────────────────────────
const LEADER_MORE = [
  { href: '/team-performance',  label: 'Team Performance', hint: 'Skor & ranking',    icon: 'team' },
  { href: '/sales',             label: 'Omzet & Produk',   hint: 'Penjualan',          icon: 'sales' },
  { href: '/content-calendar',  label: 'Content Calendar', hint: 'Jadwal konten',      icon: 'calendar' },
  { href: '/instagram-insight', label: 'Instagram Insight',hint: 'Performa akun',      icon: 'insight' },
  { href: '/extra-tasks',       label: 'Tugas Tambahan',   hint: 'Beri tugas tim',     icon: 'extra' },
  { href: '/weekly-review',     label: 'Weekly Review',    hint: 'Evaluasi',           icon: 'review' },
  { href: '/settings',          label: 'Settings',         hint: 'Pengaturan',         icon: 'settings' },
]

const MEMBER_MORE = [
  { href: '/my-performance',    label: 'Performa Saya',    hint: 'Skor & posisi',      icon: 'perf' },
  { href: '/content-calendar',  label: 'Konten Saya',      hint: 'Konten kamu',        icon: 'calendar' },
  { href: '/instagram-insight', label: 'Instagram Insight',hint: 'Performa akun',      icon: 'insight' },
  { href: '/content-calendar',  label: 'Content Calendar', hint: 'Jadwal konten',      icon: 'calendar' },
  { href: '/extra-tasks',       label: 'Tugas Tambahan',   hint: 'Dari Leader',        icon: 'extra' },
]

// ─── Tab button ─────────────────────────────────────────────
function TabBtn({
  href, label, icon, active, onClick,
}: {
  href?: string; label: string; icon: React.ReactNode; active: boolean; onClick?: () => void
}) {
  const cls = cn(
    'flex flex-col items-center gap-[3px] flex-1 cursor-pointer border-none bg-transparent py-[4px] transition-colors font-[inherit]',
    active ? 'text-[#5E7A5C]' : 'text-[#A39B82]'
  )
  const textCls = `text-[9.5px] font-${active ? '700' : '500'} leading-none`

  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        <span className={textCls}>{label}</span>
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {icon}
      <span className={textCls}>{label}</span>
    </button>
  )
}

// ─── More drawer ─────────────────────────────────────────────
function MoreDrawer({
  open, onClose, onLogout, isLeader, pathname,
}: {
  open: boolean; onClose: () => void; onLogout: () => void; isLeader: boolean; pathname: string
}) {
  const items = isLeader ? LEADER_MORE : MEMBER_MORE

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30" style={{ animation: 'fadeIn .2s ease' }} onClick={onClose}/>}
      <div className={cn(
        'fixed left-0 right-0 bottom-0 z-50 bg-[#FBF8EE] rounded-t-[20px] shadow-2xl transition-transform duration-[280ms]',
        open ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="w-[38px] h-[4px] bg-[#DDD5BE] rounded-full mx-auto mt-[10px] mb-[16px]"/>
        <div className="px-[18px] pb-[26px]">
          <div className="text-[14px] font-bold text-[#2B2A24] mb-[14px] px-[2px]">Menu Lainnya</div>
          <div className="grid grid-cols-2 gap-[10px]">
            {items.map(item => {
              const active = pathname === item.href
              const iconColor = active ? '#5E7A5C' : '#8A8267'
              return (
                <Link key={`${item.href}-${item.label}`} href={item.href} onClick={onClose}
                  className={cn(
                    'flex items-center gap-[11px] p-[12px] rounded-[12px] border cursor-pointer transition-colors',
                    active ? 'border-[#CBDCC4] bg-[#F3F7F0]' : 'border-[#EBE5D4] bg-white'
                  )}>
                  <div className={cn(
                    'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0',
                    active ? 'bg-[#E5EDDF]' : 'bg-[#EFEAD9]'
                  )}>
                    <DrawerIcon name={item.icon} color={iconColor}/>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[13px] font-semibold text-[#2B2A24] leading-tight">{item.label}</div>
                    <div className="text-[10.5px] text-[#A89F86] mt-[1px]">{item.hint}</div>
                  </div>
                </Link>
              )
            })}
            {/* Keluar */}
            <button onClick={onLogout}
              className="flex items-center gap-[11px] p-[12px] rounded-[12px] border border-[#EBE5D4] bg-white cursor-pointer text-left font-[inherit] transition-colors hover:border-[#EAC8BF] hover:bg-[#FBF1EE]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EFEAD9] flex items-center justify-center flex-shrink-0">
                <DrawerIcon name="logout" color="#B4452F"/>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#B4452F]">Keluar</div>
                <div className="text-[10.5px] text-[#A89F86] mt-[1px]">Sign out</div>
              </div>
            </button>
          </div>
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

  const MORE_HREFS = (isLeader ? LEADER_MORE : MEMBER_MORE).map(m => m.href)
  const moreActive = MORE_HREFS.includes(pathname) || moreOpen

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    qc.clear()
    router.push('/login')
  }

  return (
    <>
      {/* 5 tabs — same for leader & member */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FBF6E9] border-t border-[#E7E0CC] flex items-stretch px-[6px] pb-[14px] pt-[8px]"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}>
        <TabBtn href="/dashboard"     label="Beranda" icon={IC.home}  active={pathname === '/dashboard'} />
        <TabBtn href="/tasks"         label="Task"    icon={IC.tasks} active={pathname === '/tasks'} />
        <TabBtn href="/daily-reports" label="Daily"   icon={IC.daily} active={pathname === '/daily-reports'} />
        <TabBtn href="/kpi"           label="KPI"     icon={IC.kpi}   active={pathname === '/kpi'} />
        <TabBtn label="Lainnya" icon={IC.more} active={moreActive} onClick={() => setMoreOpen(o => !o)} />
      </nav>

      <MoreDrawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onLogout={handleLogout}
        isLeader={isLeader}
        pathname={pathname}
      />
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import { ROLE_NAMES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks } from '@/lib/queries/tasks'
import { useExtraTasks } from '@/lib/queries/extra-tasks'

// ─── Icons ─────────────────────────────────────────────────────
const IC = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  tasks:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>,
  daily:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  kpi:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>,
  team:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 5"/><path d="M21 20c0-2-1.4-3.6-3.5-4.3"/></svg>,
  perf:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  calendar:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
  sales:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="13" y="8" width="3" height="10"/></svg>,
  review:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l2 2 4-4"/></svg>,
  extra:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M12 11v6M9 14h6"/></svg>,
  settings:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 2H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L8 22h8l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>,
  logout:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

const LEADER_NAV = [
  { label: 'UTAMA', items: [
    { href: '/dashboard',         label: 'Dashboard',          icon: IC.dashboard, badge: false },
  ]},
  { label: 'KERJA TIM', items: [
    { href: '/tasks',             label: 'Task Board',         icon: IC.tasks,     badge: true },
    { href: '/daily-reports',     label: 'Daily Report',       icon: IC.daily,     badge: false },
    { href: '/kpi',               label: 'KPI & Scorecard',    icon: IC.kpi,       badge: false },
    { href: '/team-performance',  label: 'Team Performance',   icon: IC.team,      badge: false },
    { href: '/extra-tasks',       label: 'Tugas Tambahan',     icon: IC.extra,     badge: false },
  ]},
  { label: 'KONTEN', items: [
    { href: '/content-calendar',  label: 'Content Calendar',   icon: IC.calendar,  badge: false },
    { href: '/instagram-insight', label: 'Instagram Insight',  icon: IC.instagram, badge: false },
  ]},
  { label: 'BISNIS', items: [
    { href: '/sales',             label: 'Omzet & Produk',     icon: IC.sales,     badge: false },
    { href: '/weekly-review',     label: 'Weekly Review',      icon: IC.review,    badge: false },
  ]},
]

const MEMBER_NAV = [
  { label: 'UTAMA', items: [
    { href: '/dashboard',         label: 'Beranda',            icon: IC.dashboard, badge: false },
  ]},
  { label: 'PEKERJAAN SAYA', items: [
    { href: '/tasks',             label: 'Tugas Saya',         icon: IC.tasks,     badge: true },
    { href: '/daily-reports',     label: 'Daily Report',       icon: IC.daily,     badge: false },
    { href: '/content-calendar',  label: 'Konten Saya',        icon: IC.calendar,  badge: false },
    { href: '/extra-tasks',       label: 'Tugas Tambahan',     icon: IC.extra,     badge: true },
  ]},
  { label: 'PERFORMA', items: [
    { href: '/kpi',               label: 'KPI Saya',           icon: IC.kpi,       badge: false },
    { href: '/instagram-insight', label: 'Instagram Insight',  icon: IC.instagram, badge: false },
    { href: '/my-performance',    label: 'Performa Saya',      icon: IC.perf,      badge: false },
  ]},
]

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarBg(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

function NavItem({ href, label, icon, taskBadge, extraBadge }: {
  href: string; label: string; icon: React.ReactNode
  taskBadge?: number; extraBadge?: number
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  const total = (taskBadge ?? 0) + (extraBadge ?? 0)
  return (
    <Link href={href}
      className={cn(
        'flex items-center gap-[11px] px-[11px] py-[9px] my-[1px] rounded-md text-[13px] font-medium no-underline cursor-pointer transition-colors',
        active ? 'font-semibold text-[#3F5A3E] bg-[#E5EDDF]' : 'text-[#6E6B5F] hover:bg-[#EEE9D8]'
      )}>
      {icon}
      <span className="flex-1">{label}</span>
      {total > 0 && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-[#C2795A] text-white text-[10px] font-bold flex items-center justify-center px-[4px]">
          {total > 99 ? '99+' : total}
        </span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const router = useRouter()
  const qc = useQueryClient()
  const { userId, userRole, userName, isLoading, isLeader } = useApp()

  // Badge data — status set HARUS sama dengan dropdown notif di Header
  const tasksQ  = useTasks(undefined)
  const extraQ  = useExtraTasks(isLeader ? undefined : userId ?? undefined)

  const pendingTasks = (tasksQ.data ?? []).filter(t =>
    t.assignee_id === userId && ['backlog','todo','in_progress','revision'].includes(t.status)
  ).length

  const pendingExtra = (extraQ.data ?? []).filter(t =>
    t.status === 'pending'
  ).length

  const nav = isLeader ? LEADER_NAV : MEMBER_NAV
  const name = userName ?? 'User'
  const bg = isLoading ? '#9A9279' : avatarBg(name)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    qc.clear()
    router.push('/login')
  }

  return (
    <aside className="w-[236px] flex-shrink-0 h-full bg-[#FCF8EC] border-r border-[#E7E0CC] flex flex-col py-[18px] px-[14px]">
      <div className="flex items-center gap-[9px] px-2 pb-4">
        <div className="w-[30px] h-[30px] rounded-lg bg-[#7E997B] flex items-center justify-center text-[#FCF8EC] font-['Bitter'] font-bold text-[17px]">N</div>
        <div className="font-['Bitter'] font-bold text-[19px] text-[#5E7A5C] tracking-tight">
          NgajiGaes<span className="text-[#C2795A]">.</span>
        </div>
      </div>

      {nav.map(section => (
        <div key={section.label}>
          <div className="text-[10px] font-semibold tracking-[.09em] text-[#A89F86] px-[10px] py-[6px] mt-2 mb-1">
            {section.label}
          </div>
          {section.items.map(item => (
            <NavItem key={item.href} {...item}
              taskBadge={item.badge && item.href === '/tasks' ? pendingTasks : undefined}
              extraBadge={item.badge && item.href === '/extra-tasks' ? pendingExtra : undefined}
            />
          ))}
        </div>
      ))}

      <div className="flex-1" />
      {isLeader && <NavItem href="/settings" label="Settings" icon={IC.settings} />}

      <div className="border-t border-[#E7E0CC] mt-2 pt-2">
        <div className="flex items-center gap-[10px] px-2 py-[9px]">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center font-semibold text-[13px] text-[#FCF8EC] flex-shrink-0"
            style={{ background: bg }}>
            {isLoading ? '…' : getInitials(name)}
          </div>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-[13px] font-semibold text-[#2B2A24] truncate">
              {isLoading ? 'Loading…' : name}
            </div>
            <div className="text-[11px] text-[#9A9279] flex items-center gap-1">
              <span className="w-[6px] h-[6px] rounded-full bg-[#7E997B] inline-block" />
              {ROLE_NAMES[userRole]}
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-left flex items-center gap-[11px] px-[11px] py-[8px] rounded-md text-[12px] font-medium text-[#9A9279] hover:bg-[#EEE9D8] hover:text-[#B4452F] transition-colors cursor-pointer border-none bg-transparent">
          {IC.logout} Keluar
        </button>
      </div>
    </aside>
  )
}

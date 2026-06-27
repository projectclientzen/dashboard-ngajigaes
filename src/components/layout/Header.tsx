'use client'

import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useApp, type DateRange } from '@/contexts/AppContext'

const PAGE_TITLES: Record<string, [string, string]> = {
  '/dashboard':           ['Dashboard',            'Ringkasan performa tim NgajiGaes'],
  '/tasks':               ['Task Board',            'Pekerjaan tim'],
  '/daily-reports':       ['Daily Report',          'Laporan harian tim'],
  '/kpi':                 ['KPI & Scorecard',       'Target dan capaian'],
  '/team-performance':    ['Team Performance',      'Skor & ranking'],
  '/my-performance':      ['Performa Saya',         'Skor & posisi di tim'],
  '/content-calendar':    ['Content Calendar',      'Rencana & jadwal konten'],
  '/instagram-insight':   ['Instagram Insight',     'Performa akun & konten'],
  '/sales':               ['Omzet & Produk',        'Penjualan & produk'],
  '/weekly-review':       ['Weekly Review',         'Evaluasi mingguan'],
  '/settings':            ['Settings',              'Pengaturan tim & sistem'],
  '/extra-tasks':         ['Tugas Tambahan',        'Tugas langsung dari Leader'],
}

// Period picker hanya tampil di halaman yang relevan (sesuai design)
const PERIOD_PAGES = new Set(['/dashboard', '/sales', '/instagram-insight'])

const RANGE_OPTS: { id: DateRange; label: string }[] = [
  { id: 'today', label: 'Hari ini' },
  { id: '7d',    label: '7 hari' },
  { id: '30d',   label: '30 hari' },
  { id: '90d',   label: '90 hari' },
  { id: 'custom',label: 'Custom' },
]

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarBg(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

export function Header() {
  const pathname = usePathname()
  const { userName, dateRange, setDateRange, customStart, customEnd, setCustomStart, setCustomEnd } = useApp()
  const [title, subtitle] = PAGE_TITLES[pathname] ?? ['Dashboard', '']
  const showPeriod = PERIOD_PAGES.has(pathname)

  const rangeBtn = (r: DateRange) =>
    cn(
      'flex-1 py-[7px] px-[4px] rounded-[8px] text-[11.5px] font-semibold cursor-pointer border transition-all whitespace-nowrap',
      dateRange === r
        ? 'bg-[#7E997B] text-white border-[#7E997B]'
        : 'bg-white text-[#6E6B5F] border-[#E3DCC8] hover:border-[#7E997B]'
    )

  const name = userName ?? 'User'
  const initials = getInitials(name)
  const bg = avatarBg(name)

  return (
    <header className="flex-shrink-0 bg-[#FBF6E9] border-b border-[#E7E0CC] z-20">
      {/* ── Desktop header (full layout unchanged) ── */}
      <div className="hidden md:flex items-center justify-between px-[22px]" style={{ minHeight: 62 }}>
        <div>
          <div className="text-[16px] font-bold text-[#2B2A24] tracking-tight">{title}</div>
          <div className="text-[12px] text-[#9A9279]">{subtitle}</div>
        </div>
        <div className="flex items-center gap-[10px]">
          {showPeriod && (
            <div className="flex items-center gap-[5px]">
              <span className="text-[11px] text-[#9A9279] font-medium mr-[2px]">Periode</span>
              {RANGE_OPTS.map(r => (
                <button key={r.id} className={cn(
                  'px-[10px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer transition-all border',
                  dateRange === r.id ? 'bg-[#7E997B] text-white border-[#7E997B]' : 'bg-white text-[#6E6B5F] border-[#E3DCC8] hover:border-[#7E997B]'
                )} onClick={() => setDateRange(r.id)}>{r.label}</button>
              ))}
            </div>
          )}
          {showPeriod && dateRange === 'custom' && (
            <div className="flex items-center gap-[6px]">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="border border-[#E3DCC8] rounded-md px-[8px] py-[5px] text-[12px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
              <span className="text-[12px] text-[#9A9279]">–</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="border border-[#E3DCC8] rounded-md px-[8px] py-[5px] text-[12px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
            </div>
          )}
          <div className="w-px h-[26px] bg-[#E7E0CC]" />
          <div className="flex items-center gap-2 py-[5px] px-[10px] pl-[6px] border border-[#E7E0CC] rounded-lg bg-white">
            <div className="w-[26px] h-[26px] rounded-[7px] text-[#FCF8EC] flex items-center justify-center font-semibold text-[11px]"
              style={{ background: bg }}>
              {initials}
            </div>
            <div className="text-[12px] font-semibold text-[#3F3D34]">{name.split(' ')[0]}</div>
          </div>
        </div>
      </div>

      {/* ── Mobile header (sesuai design) ── */}
      <div className="md:hidden">
        {/* Row 1: Logo + brand / notif + avatar */}
        <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[11px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[30px] h-[30px] rounded-[8px] bg-[#7E997B] flex items-center justify-center text-[#FCF8EC] font-['Bitter'] font-bold text-[16px]">N</div>
            <div className="font-['Bitter'] font-bold text-[17px] text-[#5E7A5C] tracking-[-0.01em]">
              NgajiGaes<span className="text-[#C2795A]">.</span>
            </div>
          </div>
          <div className="flex items-center gap-[10px]">
            {/* Notif bell */}
            <button className="w-[34px] h-[34px] rounded-[9px] border border-[#E7E0CC] bg-white flex items-center justify-center cursor-pointer relative">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6E6B5F" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
              </svg>
              <span className="absolute top-[6px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#C2795A] border-[1.5px] border-white"/>
            </button>
            {/* Avatar */}
            <div className="w-[34px] h-[34px] rounded-[9px] text-[#FCF8EC] flex items-center justify-center font-semibold text-[12px]"
              style={{ background: bg }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Row 2: Page title + subtitle */}
        <div className="px-[16px] pb-[11px] flex items-end justify-between">
          <div>
            <div className="text-[19px] font-bold text-[#2B2A24] tracking-[-0.015em] leading-[1.1]">{title}</div>
            <div className="text-[12px] text-[#9A9279] mt-[2px]">{subtitle}</div>
          </div>
        </div>

        {/* Row 3: Period picker — only on dashboard/sales/instagram-insight */}
        {showPeriod && (
          <div className="px-[16px] pb-[10px]">
            <div className="flex items-center gap-[6px]">
              {RANGE_OPTS.filter(r => r.id !== '90d').map(r => (
                <button key={r.id} className={rangeBtn(r.id)} onClick={() => setDateRange(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-[8px] mt-[9px]">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="flex-1 border border-[#E3DCC8] rounded-[8px] px-[10px] py-[8px] text-[12px] font-[inherit] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
                <span className="text-[12px] text-[#A89F86]">–</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="flex-1 border border-[#E3DCC8] rounded-[8px] px-[10px] py-[8px] text-[12px] font-[inherit] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useApp, type DateRange } from '@/contexts/AppContext'
import { ROLE_NAMES } from '@/lib/constants'

const PAGE_TITLES: Record<string, [string, string]> = {
  '/dashboard':           ['Dashboard',            'Ringkasan performa tim NgajiGaes'],
  '/tasks':               ['Task Board',            'Kelola dan pantau pekerjaan tim'],
  '/daily-reports':       ['Daily Report',          'Laporan harian tim'],
  '/kpi':                 ['KPI & Scorecard',       'Target dan capaian tiap anggota'],
  '/team-performance':    ['Team Performance',      'Skor produktivitas dan ranking'],
  '/my-performance':      ['Performa Saya',         'Skor dan capaian pribadi'],
  '/content-calendar':    ['Content Calendar',      'Rencana dan jadwal konten'],
  '/instagram-insight':   ['Instagram Insight',     'Performa akun dan konten'],
  '/sales':               ['Omzet & Produk',        'Penjualan dan produk terjual'],
  '/weekly-review':       ['Weekly Review',         'Evaluasi dan rencana mingguan'],
  '/settings':            ['Settings',              'Pengaturan tim dan sistem'],
  '/extra-tasks':         ['Tugas Tambahan',        'Tugas langsung dari Leader'],
}

const RANGE_OPTS: { id: DateRange; label: string }[] = [
  { id: 'today', label: 'Hari ini' },
  { id: '7d',    label: '7 hari' },
  { id: '30d',   label: '30 hari' },
  { id: '90d',   label: '90 hari' },
  { id: 'custom',label: 'Custom' },
]

export function Header() {
  const pathname = usePathname()
  const { userRole, userName, dateRange, setDateRange, customStart, customEnd, setCustomStart, setCustomEnd } = useApp()
  const [title] = PAGE_TITLES[pathname] ?? ['Dashboard', '']

  const rangeBtn = (r: DateRange) =>
    cn(
      'px-[9px] py-[4px] rounded-md text-[11px] md:text-[12px] font-semibold cursor-pointer transition-all border flex-shrink-0',
      dateRange === r
        ? 'bg-[#7E997B] text-white border-[#7E997B]'
        : 'bg-white text-[#6E6B5F] border-[#E3DCC8] hover:border-[#7E997B]'
    )

  return (
    <header className="flex-shrink-0 bg-[#FBF6E9] border-b border-[#E7E0CC]">
      {/* Main row */}
      <div className="flex items-center justify-between px-[16px] md:px-[22px]" style={{ minHeight: 54 }}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo mark — mobile only (sidebar hidden) */}
          <div className="flex md:hidden w-[28px] h-[28px] rounded-lg bg-[#7E997B] items-center justify-center text-[#FCF8EC] font-['Bitter'] font-bold text-[15px] flex-shrink-0">N</div>
          <div className="text-[15px] md:text-[16px] font-bold text-[#2B2A24] tracking-tight truncate">{title}</div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatar/role chip */}
          <div className="flex items-center gap-[6px] py-[4px] px-[8px] pl-[5px] border border-[#E7E0CC] rounded-lg bg-white">
            <div className="w-[22px] h-[22px] md:w-[26px] md:h-[26px] rounded-[6px] bg-[#5E7A5C] text-[#FCF8EC] flex items-center justify-center font-semibold text-[10px] md:text-[11px]">
              {getInitials(userName ?? 'U')}
            </div>
            <div className="text-[11px] md:text-[12px] font-semibold text-[#3F3D34] hidden sm:block">{ROLE_NAMES[userRole]}</div>
          </div>
        </div>
      </div>

      {/* Period picker row — scrollable on mobile */}
      <div className="flex items-center gap-[5px] px-[16px] md:px-[22px] pb-[8px] overflow-x-auto scrollbar-hide">
        <span className="text-[11px] text-[#9A9279] font-medium flex-shrink-0">Periode</span>
        {RANGE_OPTS.map(r => (
          <button key={r.id} className={rangeBtn(r.id)} onClick={() => setDateRange(r.id)}>
            {r.label}
          </button>
        ))}
        {dateRange === 'custom' && (
          <>
            <input type="date" value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="border border-[#E3DCC8] rounded-md px-[7px] py-[4px] text-[11px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B] flex-shrink-0"/>
            <span className="text-[11px] text-[#9A9279] flex-shrink-0">–</span>
            <input type="date" value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="border border-[#E3DCC8] rounded-md px-[7px] py-[4px] text-[11px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B] flex-shrink-0"/>
          </>
        )}
      </div>
    </header>
  )
}

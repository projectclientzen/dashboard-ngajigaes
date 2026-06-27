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
  const [title, subtitle] = PAGE_TITLES[pathname] ?? ['Dashboard', '']

  const rangeBtn = (r: DateRange) =>
    cn(
      'px-[10px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer transition-all border',
      dateRange === r
        ? 'bg-[#7E997B] text-white border-[#7E997B]'
        : 'bg-white text-[#6E6B5F] border-[#E3DCC8] hover:border-[#7E997B]'
    )

  return (
    <header className="flex-shrink-0 bg-[#FBF6E9] border-b border-[#E7E0CC] flex items-center justify-between px-[22px]"
      style={{ minHeight: 62, flexWrap: 'nowrap', paddingTop: dateRange === 'custom' ? 8 : 0, paddingBottom: dateRange === 'custom' ? 8 : 0 }}>
      <div style={{ flexShrink: 0 }}>
        <div className="text-[16px] font-bold text-[#2B2A24] tracking-tight">{title}</div>
        <div className="text-[12px] text-[#9A9279]">{subtitle}</div>
      </div>
      <div className="flex items-center gap-[10px] flex-wrap justify-end">
        <div className="flex items-center gap-[5px] flex-wrap">
          <span className="text-[11px] text-[#9A9279] font-medium mr-[2px]">Periode</span>
          {RANGE_OPTS.map(r => (
            <button key={r.id} className={rangeBtn(r.id)} onClick={() => setDateRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="flex items-center gap-[6px]">
            <input type="date" value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="border border-[#E3DCC8] rounded-md px-[8px] py-[5px] text-[12px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
            <span className="text-[12px] text-[#9A9279]">–</span>
            <input type="date" value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="border border-[#E3DCC8] rounded-md px-[8px] py-[5px] text-[12px] bg-white text-[#3F3D34] focus:outline-none focus:border-[#7E997B]"/>
          </div>
        )}
        <div className="w-px h-[26px] bg-[#E7E0CC]" />
        <div className="flex items-center gap-2 py-[5px] px-[10px] pl-[6px] border border-[#E7E0CC] rounded-lg bg-white">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[#5E7A5C] text-[#FCF8EC] flex items-center justify-center font-semibold text-[11px]">
            {getInitials(userName ?? 'U')}
          </div>
          <div className="text-[12px] font-semibold text-[#3F3D34]">{ROLE_NAMES[userRole]}</div>
        </div>
      </div>
    </header>
  )
}

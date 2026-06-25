'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMock } from '@/contexts/MockContext'
import { getInitials } from '@/lib/utils'
import { ROLE_NAMES } from '@/lib/constants'

type DateRange = '7d' | '30d' | '90d'

const PAGE_TITLES: Record<string, [string, string]> = {
  '/dashboard': ['Dashboard', 'Ringkasan performa tim NgajiGaes'],
  '/tasks': ['Task Board', 'Kelola dan pantau pekerjaan tim'],
  '/daily-reports': ['Daily Report', 'Laporan harian tim'],
  '/kpi': ['KPI & Scorecard', 'Target dan capaian tiap anggota'],
  '/team-performance': ['Team Performance', 'Skor produktivitas dan ranking'],
  '/content-calendar': ['Content Calendar', 'Rencana dan jadwal konten'],
  '/instagram-insight': ['Instagram Insight', 'Performa akun dan konten'],
  '/sales': ['Omzet & Produk', 'Penjualan dan produk terjual'],
  '/weekly-review': ['Weekly Review', 'Evaluasi dan rencana mingguan'],
  '/settings': ['Settings', 'Pengaturan tim dan sistem'],
}

interface HeaderProps {
  dateRange: DateRange
  onRangeChange: (r: DateRange) => void
}

export function Header({ dateRange, onRangeChange }: HeaderProps) {
  const pathname = usePathname()
  const { data, currentRole } = useMock()
  const user = data.currentUser

  const [title, subtitle] = PAGE_TITLES[pathname] ?? ['Dashboard', '']

  const rangeLabel = {
    '7d': '7 hari terakhir',
    '30d': '30 hari terakhir',
    '90d': '90 hari terakhir',
  }[dateRange]

  const rangeBtn = (r: DateRange) =>
    cn(
      'px-[11px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer transition-all duration-150 border',
      dateRange === r
        ? 'bg-[#7E997B] text-white border-[#7E997B]'
        : 'bg-white text-[#6E6B5F] border-[#E3DCC8] hover:border-[#7E997B]'
    )

  return (
    <header className="flex-shrink-0 h-[62px] bg-[#FBF6E9] border-b border-[#E7E0CC] flex items-center justify-between px-[22px]">
      <div>
        <div className="text-[16px] font-bold text-[#2B2A24] tracking-tight">{title}</div>
        <div className="text-[12px] text-[#9A9279]">{subtitle || rangeLabel}</div>
      </div>

      <div className="flex items-center gap-[14px]">
        {/* Date range */}
        <div className="flex items-center gap-[6px]">
          <span className="text-[11px] text-[#9A9279] font-medium mr-[2px]">Periode</span>
          {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
            <button key={r} className={rangeBtn(r)} onClick={() => onRangeChange(r)}>
              {r === '7d' ? '7 hari' : r === '30d' ? '30 hari' : '90 hari'}
            </button>
          ))}
        </div>

        <div className="w-px h-[26px] bg-[#E7E0CC]" />

        {/* User pill */}
        <div className="flex items-center gap-2 py-[5px] px-[10px] pl-[6px] border border-[#E7E0CC] rounded-lg bg-white cursor-pointer">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[#5E7A5C] text-[#FCF8EC] flex items-center justify-center font-semibold text-[11px]">
            {getInitials(user.name)}
          </div>
          <div className="text-[12px] font-semibold text-[#3F3D34]">
            {ROLE_NAMES[currentRole]}
          </div>
        </div>
      </div>
    </header>
  )
}

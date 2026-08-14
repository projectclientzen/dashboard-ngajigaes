'use client'

import { useEffect, useState } from 'react'
import { getWeekRange, getMonthRange, todayJakarta, formatDate } from '@/lib/utils'

export type PeriodMode = 'week' | 'month'
export interface PeriodNavRange { start: string; end: string; mode: PeriodMode; label: string }

interface PeriodNavProps {
  defaultMode?: PeriodMode
  onChange: (range: PeriodNavRange) => void
}

/** Toggle Mingguan/Bulanan + navigasi prev/next, dengan input bulan langsung saat mode Bulanan. */
export function PeriodNav({ defaultMode = 'week', onChange }: PeriodNavProps) {
  const [mode, setMode] = useState<PeriodMode>(defaultMode)
  const [anchor, setAnchor] = useState<string>(todayJakarta())

  const range = mode === 'week' ? getWeekRange(anchor) : getMonthRange(anchor)
  const label = mode === 'week'
    ? `${formatDate(range.start, 'd MMM')} – ${formatDate(range.end, 'd MMM yyyy')}`
    : formatDate(range.start, 'MMMM yyyy')
  const today = todayJakarta()
  const isCurrent = mode === 'week' ? (today >= range.start && today <= range.end) : range.start.slice(0, 7) === today.slice(0, 7)

  useEffect(() => {
    onChange({ start: range.start, end: range.end, mode, label })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start, range.end, mode])

  function shift(dir: -1 | 1) {
    const d = new Date(anchor + 'T00:00:00')
    if (mode === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setAnchor(d.toISOString().split('T')[0])
  }

  function switchMode(m: PeriodMode) {
    setMode(m)
  }

  const segBtn = (active: boolean) =>
    `px-[11px] py-[5px] rounded-md text-[11.5px] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`
  const arrowBtn = 'w-7 h-7 flex items-center justify-center text-[#6B6656] hover:bg-[#F0EBDA] rounded-md border-none bg-transparent cursor-pointer text-[15px] leading-none'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
        <button className={segBtn(mode === 'week')} onClick={() => switchMode('week')}>Mingguan</button>
        <button className={segBtn(mode === 'month')} onClick={() => switchMode('month')}>Bulanan</button>
      </div>
      <div className="flex items-center gap-[2px] bg-white border border-[#E3DCC8] rounded-lg pl-[2px] pr-[2px]">
        <button onClick={() => shift(-1)} className={arrowBtn} aria-label="Sebelumnya">‹</button>
        {mode === 'month' ? (
          <input type="month" value={anchor.slice(0, 7)}
            onChange={e => e.target.value && setAnchor(`${e.target.value}-01`)}
            className="text-[12.5px] font-semibold text-[#2B2A24] border-none bg-transparent px-1 py-[5px] cursor-pointer focus:outline-none" />
        ) : (
          <span className="text-[12.5px] font-semibold text-[#2B2A24] px-2 whitespace-nowrap">{label}</span>
        )}
        <button onClick={() => shift(1)} className={arrowBtn} aria-label="Berikutnya">›</button>
      </div>
      {!isCurrent && (
        <button onClick={() => setAnchor(todayJakarta())}
          className="text-[11px] font-semibold text-[#4F7CAC] bg-none border-none cursor-pointer hover:underline">
          Hari ini
        </button>
      )}
    </div>
  )
}

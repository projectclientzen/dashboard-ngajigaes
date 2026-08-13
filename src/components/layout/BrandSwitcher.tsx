'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'

export function BrandSwitcher({ compact = false }: { compact?: boolean }) {
  const { brandId, setBrandId, brand, isAllBrands, brands, brandsLoading } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (brandsLoading) {
    return <div className="h-[34px] w-[130px] bg-[#EFEAD9] rounded-lg animate-pulse" />
  }

  const activeColor = isAllBrands ? '#7E997B' : (brand?.color ?? '#7E997B')
  const activeLabel = isAllBrands ? 'Semua Brand' : (brand?.name ?? '—')

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-[7px] border rounded-lg bg-white cursor-pointer transition-colors',
          compact ? 'px-[9px] py-[6px] text-[12px]' : 'px-[10px] py-[6px] text-[12.5px]',
          open ? 'border-[#7E997B]' : 'border-[#E7E0CC] hover:border-[#C5CDB4]'
        )}>
        <span className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: activeColor }} />
        <span className="font-semibold text-[#3F3D34] whitespace-nowrap">{activeLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A9279" strokeWidth="2.5"
          className={cn('transition-transform flex-shrink-0', open && 'rotate-180')}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[190px] bg-white border border-[#EBE5D4] rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => { setBrandId('all'); setOpen(false) }}
            className={cn(
              'w-full text-left px-[14px] py-[10px] flex items-center gap-[9px] cursor-pointer border-none transition-colors',
              isAllBrands ? 'bg-[#F4F8F0] text-[#3F5A3E] font-semibold' : 'bg-white text-[#5A574C] hover:bg-[#FBF6E9]'
            )}>
            <span className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: '#7E997B' }} />
            <span className="text-[12.5px]">Semua Brand</span>
            {isAllBrands && <span className="ml-auto text-[11px]">✓</span>}
          </button>
          <div className="h-px bg-[#F1ECDC]" />
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => { setBrandId(b.id); setOpen(false) }}
              className={cn(
                'w-full text-left px-[14px] py-[10px] flex items-center gap-[9px] cursor-pointer border-none transition-colors',
                brandId === b.id ? 'bg-[#F4F8F0] text-[#3F5A3E] font-semibold' : 'bg-white text-[#5A574C] hover:bg-[#FBF6E9]'
              )}>
              <span className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: b.color }} />
              <span className="text-[12.5px]">{b.name}</span>
              {brandId === b.id && <span className="ml-auto text-[11px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

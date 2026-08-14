'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { useBrands } from '@/lib/queries/brands'
import { todayJakarta } from '@/lib/utils'
import type { Role, Brand } from '@/types'

export type DateRange = 'today' | '7d' | '30d' | '90d' | 'custom'

const BRAND_STORAGE_KEY = 'ngajigaes-active-brand'

interface AppContextValue {
  // Auth
  userId: string | null
  userName: string | null
  userRole: Role
  roleId: string | null
  isLeader: boolean
  isMember: boolean
  isLoading: boolean
  // Brand (CTX-1)
  // KEAMANAN (audit K-3, 14 Agu 2026): brand switcher ini adalah FILTER
  // TAMPILAN, bukan kontrol akses. RLS di database sengaja tidak menyaring
  // per brand_id — semua anggota tim internal memang boleh melihat data
  // semua brand (dikonfirmasi Maszen). Jangan anggap brandId === 'all' vs
  // brand tertentu sebagai batas keamanan; siapa pun yang login tetap bisa
  // query lintas brand langsung ke PostgREST kalau mau.
  brandId: string | 'all'
  setBrandId: (id: string | 'all') => void
  brand: Brand | null           // null saat mode 'all'
  isAllBrands: boolean
  brands: Brand[]
  brandsLoading: boolean
  requireBrandId: () => string | null   // CTX-2: guard untuk create action
  // Date range global
  dateRange: DateRange
  setDateRange: (r: DateRange) => void
  customStart: string
  customEnd: string
  setCustomStart: (d: string) => void
  setCustomEnd: (d: string) => void
  // Range dates (computed)
  rangeStart: string
  rangeEnd: string
  rangeLabel: string
}

const AppContext = createContext<AppContextValue | null>(null)

function computeRange(range: DateRange, customStart: string, customEnd: string): { start: string; end: string; label: string } {
  // Semua tanggal berbasis WIB — bukan UTC (toISOString) yang salah antara jam 00.00–07.00 WIB
  const todayStr = todayJakarta()

  if (range === 'today') return { start: todayStr, end: todayStr, label: 'Hari ini' }
  if (range === 'custom') {
    return {
      start: customStart || todayStr,
      end: customEnd || todayStr,
      label: customStart && customEnd ? `${customStart} – ${customEnd}` : 'Custom',
    }
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const [y, m, d] = todayStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d - days + 1))
  return {
    start: start.toISOString().split('T')[0],
    end: todayStr,
    label: `${days} hari terakhir`,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useUser()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = computeRange(dateRange, customStart, customEnd)

  const userRole = user?.role ?? 'feed_socmed'
  const isLeader = userRole === 'leader'
  const isMember = !isLeader

  // ── Brand state (CTX-1) ────────────────────────────────────
  const brandsQ = useBrands()
  const brands = brandsQ.data ?? []

  const [brandId, setBrandIdState] = useState<string | 'all'>('all')

  // Load dari localStorage sekali di client
  useEffect(() => {
    const saved = localStorage.getItem(BRAND_STORAGE_KEY)
    if (saved) setBrandIdState(saved)
  }, [])

  function setBrandId(id: string | 'all') {
    setBrandIdState(id)
    localStorage.setItem(BRAND_STORAGE_KEY, id)
  }

  // Jika brand tersimpan sudah tidak aktif/ada, fallback ke 'all'
  useEffect(() => {
    if (brandId === 'all' || brands.length === 0) return
    if (!brands.some(b => b.id === brandId)) setBrandId('all')
  }, [brandId, brands])

  const brand = brandId === 'all' ? null : (brands.find(b => b.id === brandId) ?? null)
  const isAllBrands = brandId === 'all'

  // CTX-2: guard untuk aksi create — kembalikan null saat mode 'all'
  function requireBrandId(): string | null {
    return isAllBrands ? null : brandId
  }

  return (
    <AppContext.Provider value={{
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole,
      roleId: user?.role_id ?? null,
      isLeader,
      isMember,
      isLoading,
      brandId,
      setBrandId,
      brand,
      isAllBrands,
      brands,
      brandsLoading: brandsQ.isLoading,
      requireBrandId,
      dateRange,
      setDateRange,
      customStart,
      customEnd,
      setCustomStart,
      setCustomEnd,
      rangeStart,
      rangeEnd,
      rangeLabel,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

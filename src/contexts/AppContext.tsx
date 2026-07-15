'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { todayJakarta } from '@/lib/utils'
import type { Role } from '@/types'

export type DateRange = 'today' | '7d' | '30d' | '90d' | 'custom'

interface AppContextValue {
  // Auth
  userId: string | null
  userName: string | null
  userRole: Role
  roleId: string | null
  isLeader: boolean
  isMember: boolean
  isLoading: boolean
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

  return (
    <AppContext.Provider value={{
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userRole,
      roleId: user?.role_id ?? null,
      isLeader,
      isMember,
      isLoading,
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

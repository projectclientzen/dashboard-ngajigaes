'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import type { Role } from '@/types'

type DateRange = '7d' | '30d' | '90d'

interface AppContextValue {
  // Auth
  userId: string | null
  userName: string | null
  userRole: Role
  roleId: string | null
  isLeader: boolean
  isLoading: boolean
  // Date range global
  dateRange: DateRange
  setDateRange: (r: DateRange) => void
  // Range dates (computed)
  rangeStart: string
  rangeEnd: string
}

const AppContext = createContext<AppContextValue | null>(null)

function getRangeDates(range: DateRange): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  start.setDate(end.getDate() - days + 1)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(start), end: fmt(end) }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useUser()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { start: rangeStart, end: rangeEnd } = getRangeDates(dateRange)

  const userRole = user?.role ?? 'feed_socmed'
  const isLeader = userRole === 'leader'

  return (
    <AppContext.Provider
      value={{
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        userRole,
        roleId: user?.role_id ?? null,
        isLeader,
        isLoading,
        dateRange,
        setDateRange,
        rangeStart,
        rangeEnd,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

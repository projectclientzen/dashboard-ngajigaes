'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useUser } from '@/lib/hooks/useUser'
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

const fmt = (d: Date) => d.toISOString().split('T')[0]

function computeRange(range: DateRange, customStart: string, customEnd: string): { start: string; end: string; label: string } {
  const today = new Date()
  const todayStr = fmt(today)

  if (range === 'today') return { start: todayStr, end: todayStr, label: 'Hari ini' }
  if (range === 'custom') {
    return {
      start: customStart || todayStr,
      end: customEnd || todayStr,
      label: customStart && customEnd ? `${customStart} – ${customEnd}` : 'Custom',
    }
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const start = new Date(); start.setDate(today.getDate() - days + 1)
  return {
    start: fmt(start),
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

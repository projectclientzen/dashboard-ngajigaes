'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Role } from '@/types'
import { SCENARIO_LEADER, SCENARIO_TEAM, SCENARIO_EMPTY } from '@/lib/mock'

type Scenario = 'leader' | 'team' | 'empty'

interface MockContextValue {
  scenario: Scenario
  setScenario: (s: Scenario) => void
  data: typeof SCENARIO_LEADER
  currentRole: Role
}

const MockContext = createContext<MockContextValue | null>(null)

export function MockProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>('leader')

  const data =
    scenario === 'leader'
      ? SCENARIO_LEADER
      : scenario === 'team'
      ? SCENARIO_TEAM
      : SCENARIO_EMPTY

  const currentRole = data.currentUser.role

  return (
    <MockContext.Provider value={{ scenario, setScenario, data, currentRole }}>
      {children}
    </MockContext.Provider>
  )
}

export function useMock() {
  const ctx = useContext(MockContext)
  if (!ctx) throw new Error('useMock must be inside MockProvider')
  return ctx
}

'use client'

import { useState } from 'react'
import { MockProvider } from '@/contexts/MockContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

type DateRange = '7d' | '30d' | '90d'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')

  return (
    <MockProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#F4EFDF]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <Header dateRange={dateRange} onRangeChange={setDateRange} />
          <main className="flex-1 overflow-y-auto p-[20px_22px]">
            {children}
          </main>
        </div>
      </div>
    </MockProvider>
  )
}

'use client'

import { AppProvider } from '@/contexts/AppContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#F4EFDF]">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-[20px_22px]">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

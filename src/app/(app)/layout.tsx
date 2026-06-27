'use client'

import { AppProvider } from '@/contexts/AppContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#F4EFDF]">
        {/* Sidebar: desktop only */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col h-full min-w-0">
          <Header />
          {/* pb-[72px] on mobile for bottom nav clearance */}
          <main className="flex-1 overflow-y-auto p-[16px_16px] md:p-[20px_22px] pb-[72px] md:pb-[20px]">
            {children}
          </main>
        </div>
      </div>
      {/* Bottom nav: mobile only */}
      <BottomNav />
    </AppProvider>
  )
}

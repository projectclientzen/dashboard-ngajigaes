'use client'

import { useApp } from '@/contexts/AppContext'

export default function SettingsPage() {
  const { isLeader } = useApp()

  if (!isLeader) {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
        <div className="text-[16px] font-bold text-[#2B2A24]">Akses Terbatas</div>
        <div className="text-[13px] text-[#9A9279]">Halaman ini hanya untuk Leader.</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
      <div className="w-[54px] h-[54px] rounded-[14px] bg-[#EFEAD9] flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8267" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L16 2H8l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L8 22h8l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>
        </svg>
      </div>
      <div className="text-[16px] font-bold text-[#2B2A24]">Settings</div>
      <div className="text-[13px] text-[#9A9279] max-w-[420px] leading-relaxed">
        User management, role management, product management, dan pengaturan bobot productivity score. Siap dibangun di iterasi berikutnya.
      </div>
    </div>
  )
}

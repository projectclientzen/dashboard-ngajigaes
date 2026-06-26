export default function ContentCalendarPage() {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
      <div className="w-[54px] h-[54px] rounded-[14px] bg-[#EFEAD9] flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8267" strokeWidth="2">
          <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
        </svg>
      </div>
      <div className="text-[16px] font-bold text-[#2B2A24]">Content Calendar</div>
      <div className="text-[13px] text-[#9A9279] max-w-[420px] leading-relaxed">
        Kalender + list konten dengan badge status &amp; validasi, form konten lengkap, dan input insight saat published. Siap dibangun di iterasi berikutnya.
      </div>
    </div>
  )
}

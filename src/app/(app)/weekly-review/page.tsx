'use client'

export default function WeeklyReviewPage() {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
      <div className="w-[54px] h-[54px] rounded-[14px] bg-[#EFEAD9] flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8267" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6M9 14l2 2 4-4"/>
        </svg>
      </div>
      <div className="text-[16px] font-bold text-[#2B2A24]">Weekly Review</div>
      <div className="text-[13px] text-[#9A9279] max-w-[420px] leading-relaxed">
        Summary periode otomatis, input main problem / leader notes / decision, action plan list,
        dan tombol convert action plan jadi task. Arsip review tersimpan. Siap dibangun di iterasi berikutnya.
      </div>
    </div>
  )
}

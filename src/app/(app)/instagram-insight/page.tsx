export default function InstagramInsightPage() {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
      <div className="w-[54px] h-[54px] rounded-[14px] bg-[#EFEAD9] flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8A8267" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#8A8267"/>
        </svg>
      </div>
      <div className="text-[16px] font-bold text-[#2B2A24]">Instagram Insight</div>
      <div className="text-[13px] text-[#9A9279] max-w-[420px] leading-relaxed">
        Form account &amp; content insight, chart reach / followers / engagement, tabel top content. Engagement rate dihitung backend. Siap dibangun di iterasi berikutnya.
      </div>
    </div>
  )
}

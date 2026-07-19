'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useContents, useCreateContent, useUpdateContent } from '@/lib/queries/contents'
import { useReplizAccounts, useScheduleToRepliz } from '@/lib/queries/repliz'
import { useAllUsers } from '@/lib/queries/daily-reports'
import { formatDate, todayJakarta } from '@/lib/utils'
import type { ContentStatus, ContentFormat, ContentObjective, ValidationStatus, Content } from '@/types'

const STATUS_META: Record<ContentStatus, { label: string; c: string; bg: string }> = {
  idea:             { label: 'Ide',            c: '#7A766B', bg: '#EFEBDD' },
  research:         { label: 'Riset',          c: '#4F7CAC', bg: '#E8F0F6' },
  draft:            { label: 'Draft',          c: '#8A6BA8', bg: '#F0EAF7' },
  design:           { label: 'Desain',         c: '#B07A3C', bg: '#F6EFD8' },
  editing:          { label: 'Editing',        c: '#C77B3C', bg: '#F8EEE2' },
  need_review:      { label: 'Need Review',    c: '#4F7CAC', bg: '#E8F0F6' },
  need_validation:  { label: 'Validasi',       c: '#8A6BA8', bg: '#F0EAF7' },
  scheduled:        { label: 'Terjadwal',      c: '#3F8C8C', bg: '#E5F4F4' },
  published:        { label: 'Published',      c: '#5E8C61', bg: '#E9F3EA' },
  evaluated:        { label: 'Evaluated',      c: '#5E7A5C', bg: '#E9F1E6' },
  cancelled:        { label: 'Batal',          c: '#B4452F', bg: '#F7E7E2' },
}

const FORMAT_LABEL: Record<ContentFormat, string> = {
  feed_single: 'Feed Single', carousel: 'Carousel', reels: 'Reels',
  story: 'Story', ads_creative: 'Ads Creative', live: 'Live', other: 'Lainnya',
}

const OBJECTIVE_LABEL: Record<ContentObjective, string> = {
  awareness: 'Awareness', engagement: 'Engagement', education: 'Edukasi',
  trust_building: 'Trust Building', lead_generation: 'Lead Gen',
  sales: 'Sales', community_building: 'Community',
}

const VALIDATION_META: Record<ValidationStatus, { label: string; c: string }> = {
  not_needed:         { label: '—',          c: '#B0A78C' },
  waiting_validation: { label: 'Menunggu',   c: '#C77B3C' },
  revision:           { label: 'Revisi',     c: '#B4452F' },
  approved:           { label: 'Approved',   c: '#5E8C61' },
}

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[12px] font-semibold text-[#5A574C]">{label}</label>
      {children}
    </div>
  )
}

const ALL_STATUSES = Object.keys(STATUS_META) as ContentStatus[]

// Helpers untuk calendar view
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const DAYS_ID   = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

export default function ContentCalendarPage() {
  const { userId, isLeader } = useApp()
  // Tanpa filter range — kalender konten harus menampilkan konten masa depan
  // dan konten tanpa tanggal publish (range filter menyembunyikan keduanya)
  const contentsQ = useContents()
  const usersQ = useAllUsers()
  const createContent = useCreateContent()
  const updateContent = useUpdateContent()

  const [view, setView] = useState<'table' | 'calendar'>('table')
  const [calYear, setCalYear]   = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [filterStatus, setFilterStatus] = useState<ContentStatus | 'all'>('all')
  const [showDrawer, setShowDrawer] = useState(false)
  const [selected, setSelected] = useState<Content | null>(null)
  const [err, setErr] = useState('')

  // Repliz scheduling
  const replizAccountsQ = useReplizAccounts()
  const scheduleRepliz  = useScheduleToRepliz()
  const [replizAccountId, setReplizAccountId] = useState('')
  const [replizMsg, setReplizMsg] = useState('')

  async function handleScheduleRepliz() {
    if (!selected || !replizAccountId) { setReplizMsg('Pilih akun tujuan dulu.'); return }
    setReplizMsg('')
    try {
      await scheduleRepliz.mutateAsync({ content_id: selected.id, account_id: replizAccountId })
      setReplizMsg('✓ Terjadwal di Repliz')
    } catch (e) {
      setReplizMsg(`Gagal: ${(e as Error).message}`)
    }
  }

  const [form, setForm] = useState({
    title: '', format: 'feed_single' as ContentFormat,
    objective: 'awareness' as ContentObjective,
    status: 'idea' as ContentStatus,
    pic_id: '', theme: '', publish_date: '',
    caption: '', hook: '', cta: '', asset_link: '',
  })

  const contents = contentsQ.data ?? []
  const users = usersQ.data ?? []

  const filtered = filterStatus === 'all'
    ? contents
    : contents.filter(c => c.status === filterStatus)

  function openNew() {
    setSelected(null)
    // Non-leader: PIC default ke diri sendiri
    setForm({ title: '', format: 'feed_single', objective: 'awareness', status: 'idea', pic_id: isLeader ? '' : (userId ?? ''), theme: '', publish_date: '', caption: '', hook: '', cta: '', asset_link: '' })
    setErr('')
    setReplizMsg(''); setReplizAccountId('')
    setShowDrawer(true)
  }

  function openEdit(c: Content) {
    setSelected(c)
    setForm({
      title: c.title, format: c.format, objective: c.objective, status: c.status,
      pic_id: c.pic_id, theme: c.theme ?? '', publish_date: c.publish_date?.split('T')[0] ?? '',
      caption: c.caption ?? '', hook: c.hook ?? '', cta: c.cta ?? '', asset_link: c.asset_link ?? '',
    })
    setErr('')
    setReplizMsg(''); setReplizAccountId('')
    setShowDrawer(true)
  }

  async function handleSave() {
    setErr('')
    if (!form.title || !form.pic_id) { setErr('Judul dan PIC wajib diisi.'); return }
    try {
      const payload = {
        title: form.title,
        format: form.format,
        objective: form.objective,
        status: form.status,
        pic_id: form.pic_id,
        theme: form.theme || null,
        publish_date: form.publish_date || null,
        ...(form.caption && { caption: form.caption }),
        ...(form.hook && { hook: form.hook }),
        ...(form.cta && { cta: form.cta }),
        ...(form.asset_link && { asset_link: form.asset_link }),
      }
      if (selected) {
        await updateContent.mutateAsync({ id: selected.id, ...payload })
      } else {
        await createContent.mutateAsync(payload)
      }
      setShowDrawer(false)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  const isPending = createContent.isPending || updateContent.isPending

  const segBtn = (active: boolean) =>
    `px-[13px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`

  return (
    <div className="flex flex-col gap-4">
      {/* View toggle + Filter + tombol */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px] mr-2">
            <button className={segBtn(view === 'table')} onClick={() => setView('table')}>Tabel</button>
            <button className={segBtn(view === 'calendar')} onClick={() => setView('calendar')}>Kalender</button>
          </div>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-[12px] py-[5px] rounded-full text-[12px] font-semibold border-none cursor-pointer transition-all ${filterStatus === 'all' ? 'bg-[#5E7A5C] text-white' : 'bg-[#EFEAD9] text-[#5A574C]'}`}>
            Semua ({contents.length})
          </button>
          {ALL_STATUSES.filter(s => contents.some(c => c.status === s)).map(s => {
            const m = STATUS_META[s]
            const count = contents.filter(c => c.status === s).length
            return (
              <button key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-[12px] py-[5px] rounded-full text-[12px] font-semibold border-none cursor-pointer transition-all`}
                style={filterStatus === s
                  ? { background: m.c, color: '#fff' }
                  : { background: m.bg, color: m.c }}>
                {m.label} ({count})
              </button>
            )
          })}
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-[6px] bg-[#5E7A5C] text-white border-none rounded-md px-[15px] py-[8px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors">
          + Buat Konten
        </button>
      </div>

      {/* ── Calendar View ──────────────────────────────── */}
      {view === 'calendar' && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          {/* Nav bulan */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#FBF6E9] border-b border-[#EBE5D4]">
            <button onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
              else setCalMonth(m => m - 1)
            }} className="px-3 py-1 rounded-md text-[13px] text-[#5A574C] hover:bg-[#EFEAD9] border-none bg-none cursor-pointer">‹</button>
            <span className="text-[14px] font-bold text-[#2B2A24]">{MONTHS_ID[calMonth]} {calYear}</span>
            <button onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
              else setCalMonth(m => m + 1)
            }} className="px-3 py-1 rounded-md text-[13px] text-[#5A574C] hover:bg-[#EFEAD9] border-none bg-none cursor-pointer">›</button>
          </div>
          {/* Grid hari */}
          <div className="grid grid-cols-7 border-b border-[#EBE5D4]">
            {DAYS_ID.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold text-[#A89F86] bg-[#FBF6E9]">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {/* Padding hari pertama */}
            {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
              <div key={`pad-${i}`} className="border-r border-b border-[#F1ECDC] min-h-[80px] bg-[#FDFAF3]"/>
            ))}
            {/* Hari dalam bulan */}
            {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
              const day  = i + 1
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const dayContents = filtered.filter(c => c.publish_date?.startsWith(dateStr))
              const isToday = dateStr === todayJakarta()
              return (
                <div key={day} className="border-r border-b border-[#F1ECDC] min-h-[80px] p-[4px]">
                  <div className={`text-[11px] font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#5E7A5C] text-white' : 'text-[#7A766B]'}`}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    {dayContents.map(c => {
                      const sm = STATUS_META[c.status]
                      return (
                        <button key={c.id}
                          onClick={() => openEdit(c)}
                          className="text-left text-[10px] font-semibold px-[5px] py-[2px] rounded truncate w-full border-none cursor-pointer"
                          style={{ background: sm.bg, color: sm.c }}>
                          {c.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Table View ──────────────────────────────────── */}
      {view === 'table' && <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        {contentsQ.isLoading ? (
          <div className="p-8 text-center text-[13px] text-[#9A9279]">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-2 text-center">
            <div className="text-[15px] font-bold text-[#2B2A24]">Belum ada konten</div>
            <div className="text-[13px] text-[#9A9279]">
              {filterStatus === 'all' ? 'Buat konten pertama untuk periode ini.' : `Tidak ada konten dengan status "${STATUS_META[filterStatus]?.label}".`}
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#FBF6E9]">
                {['JUDUL & FORMAT', 'OBJEKTIF', 'PIC', 'TANGGAL', 'STATUS', 'VALIDASI', ''].map(h => (
                  <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const sm = STATUS_META[c.status]
                const vm = VALIDATION_META[c.validation_status]
                return (
                  <tr key={c.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3] cursor-pointer"
                    onClick={() => openEdit(c)}>
                    <td className="p-[11px_16px]">
                      <div className="font-semibold text-[#2B2A24] max-w-[220px] truncate">{c.title}</div>
                      <div className="text-[11px] text-[#A89F86] mt-[2px]">{FORMAT_LABEL[c.format]}</div>
                    </td>
                    <td className="p-[11px_16px] text-[#5A574C] text-[12px]">{OBJECTIVE_LABEL[c.objective]}</td>
                    <td className="p-[11px_16px] text-[#5A574C]">{c.pic_name}</td>
                    <td className="p-[11px_16px] text-[#5A574C] text-[12px]">
                      {c.publish_date ? formatDate(c.publish_date, 'd MMM yyyy') : '—'}
                    </td>
                    <td className="p-[11px_16px]">
                      <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full"
                        style={{ color: sm.c, background: sm.bg }}>{sm.label}</span>
                    </td>
                    <td className="p-[11px_16px]">
                      <span className="text-[11px] font-semibold" style={{ color: vm.c }}>{vm.label}</span>
                    </td>
                    <td className="p-[11px_16px]">
                      <span className="text-[11px] text-[#4F7CAC]">Edit →</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>}

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/[.28]" onClick={() => setShowDrawer(false)}/>
          <div className="absolute top-0 right-0 w-[460px] max-w-[94vw] h-full bg-[#FBF8EE] shadow-xl p-6 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#2B2A24]">
                {selected ? 'Edit Konten' : 'Buat Konten Baru'}
              </h3>
              <button onClick={() => setShowDrawer(false)}
                className="text-[#9A9279] text-xl border-none bg-none cursor-pointer leading-none">×</button>
            </div>

            <Field label="Judul Konten *">
              <input className={inputCls} placeholder="Judul konten..."
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Format">
                <select className={inputCls} value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value as ContentFormat }))}>
                  {Object.entries(FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Objektif">
                <select className={inputCls} value={form.objective}
                  onChange={e => setForm(f => ({ ...f, objective: e.target.value as ContentObjective }))}>
                  {Object.entries(OBJECTIVE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select className={inputCls} value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentStatus }))}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </Field>
              <Field label="PIC *">
                <select className={inputCls} value={form.pic_id}
                  onChange={e => setForm(f => ({ ...f, pic_id: e.target.value }))}>
                  <option value="">Pilih PIC...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tema / Topik">
                <input className={inputCls} placeholder="Tema konten"
                  value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}/>
              </Field>
              <Field label="Tanggal Publish">
                <input className={inputCls} type="date"
                  value={form.publish_date} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}/>
              </Field>
            </div>

            <Field label="Hook (kalimat pembuka)">
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Hook yang menarik..."
                value={form.hook} onChange={e => setForm(f => ({ ...f, hook: e.target.value }))}/>
            </Field>

            <Field label="Caption">
              <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Caption konten..."
                value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}/>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA">
                <input className={inputCls} placeholder="Call to action..."
                  value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}/>
              </Field>
              <Field label="Link Asset">
                <input className={inputCls} placeholder="https://drive.google.com/..."
                  value={form.asset_link} onChange={e => setForm(f => ({ ...f, asset_link: e.target.value }))}/>
              </Field>
            </div>

            {/* ── Repliz Scheduling (hanya untuk konten existing) ── */}
            {selected && (
              <div className="border border-[#E3DCC8] rounded-lg overflow-hidden">
                <div className="px-3 py-[9px] bg-[#F8F4E8]">
                  <div className="text-[12px] font-bold text-[#2B2A24]">Jadwalkan via Repliz</div>
                  <div className="text-[11px] text-[#A89F86]">
                    Post otomatis ke sosmed sesuai Tanggal Publish (butuh Link Asset berisi URL media)
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {selected.repliz_schedule_id ? (
                    <div className="text-[12px] text-[#5E8C61] bg-[#E9F3EA] rounded-md px-3 py-2">
                      ✓ Sudah terjadwal · status: <b>{selected.repliz_status ?? 'scheduled'}</b>
                      {(selected.likes ?? selected.comments ?? selected.shares) != null && (
                        <span className="block mt-1 text-[#4F7CAC]">
                          ❤️ {selected.likes ?? 0} · 💬 {selected.comments ?? 0} · 🔁 {selected.shares ?? 0}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <select className={inputCls} value={replizAccountId}
                        onChange={e => setReplizAccountId(e.target.value)}>
                        <option value="">
                          {replizAccountsQ.isLoading ? 'Memuat akun...'
                            : replizAccountsQ.isError ? 'Repliz belum dikonfigurasi'
                            : 'Pilih akun tujuan...'}
                        </option>
                        {(replizAccountsQ.data ?? []).map(a => (
                          <option key={a.id} value={a.id}>{a.platform ? `[${a.platform}] ` : ''}{a.name}</option>
                        ))}
                      </select>
                      <button onClick={handleScheduleRepliz}
                        disabled={scheduleRepliz.isPending || !replizAccountId}
                        className="bg-[#4F7CAC] text-white border-none rounded-md py-[9px] text-[12px] font-semibold cursor-pointer hover:bg-[#3F6A9A] disabled:opacity-50 transition-colors">
                        {scheduleRepliz.isPending ? 'Menjadwalkan...' : '📅 Jadwalkan ke Sosmed'}
                      </button>
                    </>
                  )}
                  {replizMsg && (
                    <div className={`text-[11px] font-semibold ${replizMsg.startsWith('✓') ? 'text-[#5E8C61]' : 'text-[#B4452F]'}`}>
                      {replizMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {err && (
              <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-[8px]">{err}</div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowDrawer(false)}
                className="flex-1 bg-[#EFEAD9] text-[#5A574C] border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer">
                Batal
              </button>
              <button onClick={handleSave} disabled={isPending}
                className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50">
                {isPending ? 'Menyimpan...' : selected ? 'Simpan Perubahan' : 'Buat Konten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useExtraTasks, useCreateExtraTask, useUpdateExtraTaskStatus } from '@/lib/queries/extra-tasks'
import { useAllUsers } from '@/lib/queries/daily-reports'
import { formatDate } from '@/lib/utils'
import type { ExtraTask } from '@/lib/queries/extra-tasks'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarBg(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_META = {
  pending:     { label: 'Pending',   c: '#C77B3C', bg: '#F8EEE2' },
  in_progress: { label: 'Progress',  c: '#4F7CAC', bg: '#E8F0F6' },
  done:        { label: 'Done',      c: '#5E8C61', bg: '#E9F3EA' },
} as const

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

function StatusBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`px-[11px] py-[5px] rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
        active ? 'bg-[#5E7A5C] text-white border-[#5E7A5C]' : 'bg-white text-[#7A766B] border-[#E3DCC8] hover:border-[#5E7A5C]'
      }`}>
      {label}
    </button>
  )
}

function ExtraCard({ task, isLeader, onStatusChange }: {
  task: ExtraTask; isLeader: boolean; onStatusChange: (s: ExtraTask['status']) => void
}) {
  const sm = STATUS_META[task.status]
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-xl p-[14px] flex flex-col gap-[10px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-[#2B2A24] leading-[1.3]">{task.title}</div>
          {task.note && <div className="text-[12px] text-[#7A766B] mt-[4px] leading-[1.45]">{task.note}</div>}
        </div>
        <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full flex-shrink-0"
          style={{ color: sm.c, background: sm.bg }}>{sm.label}</span>
      </div>
      <div className="flex items-center gap-[8px]">
        <div className="w-6 h-6 rounded-[7px] flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
          style={{ background: avatarBg(task.assignee_name) }}>
          {getInitials(task.assignee_name)}
        </div>
        <span className="text-[12px] text-[#5A574C]">{task.assignee_name}</span>
        <span className="text-[11px] text-[#B0A78C] ml-auto">{formatDate(task.created_at, 'd MMM')}</span>
      </div>
      <div className="flex items-center gap-[7px] pt-[10px] border-t border-[#F1ECDC]">
        <StatusBtn active={task.status === 'pending'}     onClick={() => onStatusChange('pending')}     label="Pending" />
        <StatusBtn active={task.status === 'in_progress'} onClick={() => onStatusChange('in_progress')} label="Progress" />
        <StatusBtn active={task.status === 'done'}        onClick={() => onStatusChange('done')}        label="Done" />
      </div>
    </div>
  )
}

export default function ExtraTasksPage() {
  const { userId, isLeader } = useApp()
  const extraQ   = useExtraTasks(isLeader ? undefined : userId ?? undefined)
  const usersQ   = useAllUsers()
  const create   = useCreateExtraTask()
  const updateSt = useUpdateExtraTaskStatus()

  const [form, setForm]   = useState({ title: '', note: '', assignee_id: '' })
  const [err, setErr]     = useState('')
  const [saved, setSaved] = useState(false)

  const tasks = extraQ.data ?? []
  const done  = tasks.filter(t => t.status === 'done').length
  const prog  = tasks.filter(t => t.status === 'in_progress').length
  const pend  = tasks.filter(t => t.status === 'pending').length

  async function handleAdd() {
    setErr('')
    if (!form.title || !form.assignee_id) { setErr('Judul dan anggota wajib diisi.'); return }
    try {
      await create.mutateAsync({ title: form.title, note: form.note || undefined, assignee_id: form.assignee_id, created_by: userId! })
      setForm({ title: '', note: '', assignee_id: '' })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setErr((e as Error).message) }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Done',     val: done, c: '#5E8C61', bg: '#E9F3EA' },
          { label: 'Progress', val: prog, c: '#4F7CAC', bg: '#E8F0F6' },
          { label: 'Pending',  val: pend, c: '#C77B3C', bg: '#F8EEE2' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#EBE5D4] rounded-lg p-4 text-center">
            <div className="text-[24px] font-bold" style={{ color: s.c }}>{s.val}</div>
            <div className="text-[11px] text-[#9A9279] mt-[3px]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leader: form beri tugas */}
      {isLeader && (
        <div className="bg-white border border-[#EBE5D4] rounded-xl p-5 flex flex-col gap-4">
          <h3 className="text-[14px] font-bold text-[#2B2A24]">Beri Tugas Tambahan</h3>
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Judul Tugas</label>
            <input className={inputCls} placeholder="Mis. Bantu balas DM promo..."
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Anggota</label>
              <select className={inputCls} value={form.assignee_id}
                onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                <option value="">Pilih anggota…</option>
                {(usersQ.data ?? []).filter(u => u.id !== userId).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Catatan (opsional)</label>
              <input className={inputCls} placeholder="Detail / instruksi..."
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}/>
            </div>
          </div>
          {err && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-2">{err}</div>}
          <div className="flex items-center gap-3">
            <button onClick={handleAdd} disabled={create.isPending}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-[18px] py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50 transition-colors">
              {create.isPending ? 'Menyimpan...' : '+ Tambahkan'}
            </button>
            {saved && <span className="text-[12px] text-[#5E8C61] font-semibold">✓ Ditambahkan</span>}
          </div>
        </div>
      )}

      {/* Daftar tugas */}
      <div>
        <h3 className="text-[13px] font-bold text-[#5A574C] mb-3">
          {isLeader ? 'Semua Tugas Tambahan' : 'Tugas Tambahan dari Leader'} ({tasks.length})
        </h3>
        {extraQ.isLoading ? (
          <div className="bg-white border border-[#EBE5D4] rounded-xl p-8 text-center text-[13px] text-[#9A9279]">Memuat...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white border border-[#EBE5D4] rounded-xl p-10 text-center">
            <div className="text-[15px] font-bold text-[#2B2A24] mb-1">Belum ada tugas tambahan</div>
            <div className="text-[13px] text-[#9A9279]">
              {isLeader ? 'Gunakan form di atas untuk memberi tugas.' : 'Tugas dari leader akan muncul di sini.'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map(t => (
              <ExtraCard key={t.id} task={t} isLeader={isLeader}
                onStatusChange={s => updateSt.mutate({ id: t.id, status: s })}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

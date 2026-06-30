'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useExtraTasks, useCreateExtraTask, useUpdateExtraTaskStatus, useReplyExtraTask } from '@/lib/queries/extra-tasks'
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
  pending:     { label: 'Pending',  c: '#C77B3C', bg: '#F8EEE2' },
  in_progress: { label: 'Progress', c: '#4F7CAC', bg: '#E8F0F6' },
  done:        { label: 'Done',     c: '#5E8C61', bg: '#E9F3EA' },
} as const

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

// ── Card untuk Leader ────────────────────────────────────────
function LeaderCard({ task, onStatusChange, onClick }: {
  task: ExtraTask
  onStatusChange: (s: ExtraTask['status']) => void
  onClick: () => void
}) {
  const sm = STATUS_META[task.status]
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-xl p-[14px] flex flex-col gap-[10px] cursor-pointer hover:border-[#C5CDB4] transition-colors"
      onClick={onClick}>
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
      {/* Status buttons - leader ubah langsung */}
      <div className="flex items-center gap-[7px] pt-[10px] border-t border-[#F1ECDC]"
        onClick={e => e.stopPropagation()}>
        {(['pending','in_progress','done'] as const).map(s => (
          <button key={s} onClick={() => onStatusChange(s)}
            className={`px-[11px] py-[5px] rounded-md text-[11px] font-semibold border cursor-pointer transition-colors ${
              task.status === s
                ? 'bg-[#5E7A5C] text-white border-[#5E7A5C]'
                : 'bg-white text-[#7A766B] border-[#E3DCC8] hover:border-[#5E7A5C]'
            }`}>
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Card untuk Tim ───────────────────────────────────────────
function TeamCard({ task, onClick }: { task: ExtraTask; onClick: () => void }) {
  const sm = STATUS_META[task.status]
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-xl p-[14px] flex flex-col gap-[10px] cursor-pointer hover:border-[#C5CDB4] transition-colors"
      onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-[#2B2A24] leading-[1.3]">{task.title}</div>
          {task.note && <div className="text-[12px] text-[#7A766B] mt-[4px] leading-[1.45]">{task.note}</div>}
        </div>
        <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full flex-shrink-0"
          style={{ color: sm.c, background: sm.bg }}>{sm.label}</span>
      </div>
      <div className="flex items-center gap-[8px]">
        <span className="text-[12px] text-[#9A9279]">dari {task.created_by_name}</span>
        <span className="text-[11px] text-[#B0A78C] ml-auto">{formatDate(task.created_at, 'd MMM')}</span>
      </div>
      {task.reply && (
        <div className="text-[11px] text-[#5E8C61] bg-[#E9F3EA] rounded-md px-[10px] py-[5px]">
          ✓ Sudah dijawab
        </div>
      )}
      <div className="text-[11px] text-[#4F7CAC] mt-1">Klik untuk lihat detail & jawab →</div>
    </div>
  )
}

// ── Popup detail task (tim) ──────────────────────────────────
function TeamDetailPopup({ task, onClose, onStatusChange, onReply, isReplying }: {
  task: ExtraTask
  onClose: () => void
  onStatusChange: (s: ExtraTask['status']) => void
  onReply: (reply: string, reply_url: string) => void
  isReplying: boolean
}) {
  const [reply, setReply] = useState(task.reply ?? '')
  const [replyUrl, setReplyUrl] = useState(task.reply_url ?? '')
  const sm = STATUS_META[task.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-[#FBF8EE] rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-[#8A8267] bg-[#EFEAD9] rounded-full px-[10px] py-[3px] inline-block mb-2">
              Tugas Tambahan
            </div>
            <h3 className="text-[17px] font-bold text-[#2B2A24] leading-[1.3]">{task.title}</h3>
          </div>
          <button onClick={onClose} className="text-[#9A9279] text-[20px] border-none bg-none cursor-pointer leading-none flex-shrink-0">×</button>
        </div>

        {/* Status badge */}
        <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full self-start"
          style={{ color: sm.c, background: sm.bg }}>{sm.label}</span>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-[12px] p-[14px] bg-[#FCFAF2] border border-[#EFE9D8] rounded-lg">
          <div>
            <div className="text-[11px] text-[#A89F86] mb-[4px]">Dari</div>
            <div className="text-[13px] font-semibold text-[#2B2A24]">{task.created_by_name}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#A89F86] mb-[4px]">Tanggal</div>
            <div className="text-[13px] font-semibold text-[#2B2A24]">{formatDate(task.created_at, 'd MMM yyyy')}</div>
          </div>
        </div>

        {/* Catatan singkat */}
        {task.note && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-[5px]">Catatan</div>
            <div className="text-[13px] text-[#5A574C] leading-[1.5]">{task.note}</div>
          </div>
        )}

        {/* Deskripsi detail */}
        {task.description && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-[5px]">Deskripsi</div>
            <div className="text-[13px] text-[#5A574C] leading-[1.55] whitespace-pre-wrap">{task.description}</div>
          </div>
        )}

        {/* Link dari leader */}
        {task.leader_url && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-[5px]">Link Referensi</div>
            <a href={task.leader_url} target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-[#4F7CAC] underline break-all">
              {task.leader_url}
            </a>
          </div>
        )}

        <div className="border-t border-[#EFE9D8] pt-3 flex flex-col gap-3">
          <div className="text-[13px] font-bold text-[#2B2A24]">Jawaban / Noted</div>

          {/* Status update */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Update Status</label>
            <select className={inputCls} value={task.status}
              onChange={e => onStatusChange(e.target.value as ExtraTask['status'])}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Reply text */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Jawaban / Catatan</label>
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="Tulis jawaban atau catatan progress kamu..."
              value={reply} onChange={e => setReply(e.target.value)}/>
          </div>

          {/* Reply URL */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Upload Link</label>
            <input className={inputCls} placeholder="https://drive.google.com/..."
              value={replyUrl} onChange={e => setReplyUrl(e.target.value)}/>
          </div>

          <button onClick={() => onReply(reply, replyUrl)} disabled={isReplying}
            className="bg-[#5E7A5C] text-white border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50 transition-colors">
            {isReplying ? 'Menyimpan...' : 'Simpan Jawaban'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Popup detail task (leader view) ─────────────────────────
function LeaderDetailPopup({ task, onClose }: { task: ExtraTask; onClose: () => void }) {
  const sm = STATUS_META[task.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-[#FBF8EE] rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[17px] font-bold text-[#2B2A24] leading-[1.3] flex-1">{task.title}</h3>
          <button onClick={onClose} className="text-[#9A9279] text-[20px] border-none bg-none cursor-pointer leading-none">×</button>
        </div>

        <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full self-start"
          style={{ color: sm.c, background: sm.bg }}>{sm.label}</span>

        <div className="grid grid-cols-2 gap-3 p-[14px] bg-[#FCFAF2] border border-[#EFE9D8] rounded-lg">
          <div>
            <div className="text-[11px] text-[#A89F86] mb-1">Assignee</div>
            <div className="flex items-center gap-[7px]">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold text-white"
                style={{ background: avatarBg(task.assignee_name) }}>
                {getInitials(task.assignee_name)}
              </div>
              <span className="text-[13px] font-semibold text-[#2B2A24]">{task.assignee_name}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#A89F86] mb-1">Dibuat</div>
            <div className="text-[13px] font-semibold text-[#2B2A24]">{formatDate(task.created_at, 'd MMM yyyy')}</div>
          </div>
        </div>

        {task.note && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-1">Catatan</div>
            <div className="text-[13px] text-[#5A574C] leading-[1.5]">{task.note}</div>
          </div>
        )}
        {task.description && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-1">Deskripsi</div>
            <div className="text-[13px] text-[#5A574C] leading-[1.55] whitespace-pre-wrap">{task.description}</div>
          </div>
        )}
        {task.leader_url && (
          <div>
            <div className="text-[12px] font-semibold text-[#5A574C] mb-1">Link Referensi</div>
            <a href={task.leader_url} target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-[#4F7CAC] underline break-all">{task.leader_url}</a>
          </div>
        )}

        {/* Jawaban tim */}
        {(task.reply || task.reply_url) && (
          <div className="border-t border-[#EFE9D8] pt-3 flex flex-col gap-3">
            <div className="text-[13px] font-bold text-[#2B2A24]">Jawaban Tim</div>
            {task.reply && (
              <div className="bg-[#FCFAF2] border border-[#EFE9D8] rounded-lg p-3">
                <div className="text-[12px] font-semibold text-[#5A574C] mb-1">{task.assignee_name}:</div>
                <div className="text-[13px] text-[#3F3D34] leading-[1.5] whitespace-pre-wrap">{task.reply}</div>
              </div>
            )}
            {task.reply_url && (
              <div>
                <div className="text-[12px] font-semibold text-[#5A574C] mb-1">Link Upload</div>
                <a href={task.reply_url} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-[#4F7CAC] underline break-all">{task.reply_url}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function ExtraTasksPage() {
  const { userId, isLeader } = useApp()
  const extraQ   = useExtraTasks(isLeader ? undefined : userId ?? undefined)
  const usersQ   = useAllUsers()
  const create   = useCreateExtraTask()
  const updateSt = useUpdateExtraTaskStatus()
  const reply    = useReplyExtraTask()

  const [form, setForm] = useState({
    title: '', note: '', description: '', leader_url: '', assignee_id: '',
  })
  const [err, setErr]         = useState('')
  const [saved, setSaved]     = useState(false)
  const [selectedTask, setSelectedTask] = useState<ExtraTask | null>(null)

  const tasks = extraQ.data ?? []
  const done  = tasks.filter(t => t.status === 'done').length
  const prog  = tasks.filter(t => t.status === 'in_progress').length
  const pend  = tasks.filter(t => t.status === 'pending').length

  async function handleAdd() {
    setErr('')
    if (!form.title || !form.assignee_id) { setErr('Judul dan anggota wajib diisi.'); return }
    try {
      await create.mutateAsync({
        title: form.title,
        note: form.note || undefined,
        description: form.description || undefined,
        leader_url: form.leader_url || undefined,
        assignee_id: form.assignee_id,
        created_by: userId!,
      })
      setForm({ title: '', note: '', description: '', leader_url: '', assignee_id: '' })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) { setErr((e as Error).message) }
  }

  async function handleReply(taskId: string, replyText: string, replyUrl: string) {
    await reply.mutateAsync({ id: taskId, reply: replyText || undefined, reply_url: replyUrl || undefined })
    setSelectedTask(null)
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
              <label className="text-[12px] font-semibold text-[#5A574C]">Catatan Singkat (opsional)</label>
              <input className={inputCls} placeholder="Instruksi singkat..."
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}/>
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Deskripsi Detail (opsional)</label>
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="Penjelasan lengkap tugas, langkah-langkah, atau hal yang perlu diperhatikan..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          </div>

          <div className="flex flex-col gap-[6px]">
            <label className="text-[12px] font-semibold text-[#5A574C]">Link Referensi (opsional)</label>
            <input className={inputCls} placeholder="https://drive.google.com/... atau link apapun"
              value={form.leader_url} onChange={e => setForm(f => ({ ...f, leader_url: e.target.value }))}/>
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
            {tasks.map(t => isLeader ? (
              <LeaderCard key={t.id} task={t}
                onStatusChange={s => updateSt.mutate({ id: t.id, status: s })}
                onClick={() => setSelectedTask(t)}/>
            ) : (
              <TeamCard key={t.id} task={t} onClick={() => setSelectedTask(t)}/>
            ))}
          </div>
        )}
      </div>

      {/* Popup detail — tim */}
      {selectedTask && !isLeader && (
        <TeamDetailPopup
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={s => {
            updateSt.mutate({ id: selectedTask.id, status: s })
            setSelectedTask({ ...selectedTask, status: s })
          }}
          onReply={(r, ru) => handleReply(selectedTask.id, r, ru)}
          isReplying={reply.isPending}
        />
      )}

      {/* Popup detail — leader (lihat jawaban) */}
      {selectedTask && isLeader && (
        <LeaderDetailPopup task={selectedTask} onClose={() => setSelectedTask(null)}/>
      )}
    </div>
  )
}

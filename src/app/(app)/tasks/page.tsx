'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useTasks, useTaskComments, useUpdateTaskStatus, useCreateTask, useAddComment } from '@/lib/queries/tasks'
import { useAllUsers } from '@/lib/queries/daily-reports'
import { cn, getInitials, formatDate } from '@/lib/utils'
import type { Task, TaskStatus, Priority } from '@/types'

const KANBAN_COLS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog',     label: 'Backlog',     color: '#9A9279' },
  { id: 'todo',        label: 'To Do',       color: '#6E6B5F' },
  { id: 'in_progress', label: 'In Progress', color: '#4F7CAC' },
  { id: 'need_review', label: 'Need Review', color: '#8A6BA8' },
  { id: 'revision',    label: 'Revision',    color: '#C77B3C' },
  { id: 'done',        label: 'Done',        color: '#5E8C61' },
  { id: 'blocked',     label: 'Blocked',     color: '#B4452F' },
  { id: 'cancelled',   label: 'Cancelled',   color: '#B0A78C' },
]

const PRIO: Record<string, { c: string; bg: string; t: string }> = {
  low:    { c: '#7A766B', bg: '#EFEBDD', t: 'Low' },
  medium: { c: '#4F7CAC', bg: '#E8F0F6', t: 'Medium' },
  high:   { c: '#C77B3C', bg: '#F8EEE2', t: 'High' },
  urgent: { c: '#B4452F', bg: '#F7E7E2', t: 'Urgent' },
}

const CATEGORIES = ['Konten','Desain','Copywriting','Admin','Riset','Ads','Lainnya']

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

function PrioBadge({ p }: { p: string }) {
  const m = PRIO[p] ?? PRIO.medium
  return <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color: m.c, background: m.bg }}>{m.t}</span>
}

function StatusBadge({ s }: { s: string }) {
  const col = KANBAN_COLS.find(c => c.id === s)
  const color = col?.color ?? '#9A9279'
  return <span className="text-[10px] font-semibold px-[9px] py-[3px] rounded-full" style={{ color, background: color + '1A' }}>{col?.label ?? s}</span>
}

function Skeleton() {
  return <div className="bg-white border border-[#EBE5D4] rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-[#EDE7D6] rounded w-3/4 mb-3"/><div className="h-3 bg-[#EDE7D6] rounded w-1/2"/>
  </div>
}

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

export default function TasksPage() {
  const { userId, isLeader, isLoading: authLoading } = useApp()
  const tasksQ     = useTasks(isLeader ? undefined : userId ?? undefined)
  const usersQ     = useAllUsers()
  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTask()
  const addComment = useAddComment()

  const [view, setView]           = useState<'kanban' | 'table'>('kanban')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragId, setDragId]       = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [commentText, setCommentText] = useState('')

  const commentsQ = useTaskComments(selectedId)
  const selected  = (tasksQ.data ?? []).find(t => t.id === selectedId) ?? null

  const [form, setForm] = useState({
    title: '', description: '', category: 'Konten',
    assignee_id: '', priority: 'medium' as Priority, deadline: '',
  })
  const [formErr, setFormErr] = useState('')

  const segBtn = (active: boolean) => cn(
    'px-[14px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all',
    active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'
  )

  async function handleCreate() {
    setFormErr('')
    if (!form.title || !form.assignee_id) { setFormErr('Judul dan PIC wajib diisi.'); return }
    try {
      await createTask.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        assignee_id: form.assignee_id,
        created_by: userId!,
        priority: form.priority,
        ...(form.deadline && { deadline: form.deadline }),
      })
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'Konten', assignee_id: '', priority: 'medium', deadline: '' })
    } catch (e) { setFormErr((e as Error).message) }
  }

  async function handleComment() {
    if (!commentText.trim() || !selectedId || !userId) return
    await addComment.mutateAsync({ taskId: selectedId, userId, comment: commentText.trim() })
    setCommentText('')
  }

  if (authLoading || tasksQ.isLoading) {
    return <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_,i) => <Skeleton key={i}/>)}</div>
  }

  const tasks = tasksQ.data ?? []
  const users = usersQ.data ?? []

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex justify-between items-center">
        <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
          <button className={segBtn(view === 'kanban')} onClick={() => setView('kanban')}>Kanban</button>
          <button className={segBtn(view === 'table')} onClick={() => setView('table')}>Tabel</button>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-[6px] bg-[#5E7A5C] text-white border-none rounded-md px-[15px] py-[8px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors">
          + Buat Task
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center gap-3 text-center">
          <div className="text-[16px] font-bold text-[#2B2A24]">Belum ada task</div>
          <div className="text-[13px] text-[#9A9279]">
            Klik &quot;+ Buat Task&quot; untuk membuat task dan assign ke anggota tim.
          </div>
        </div>
      )}

      {tasks.length > 0 && view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-[10px]">
          {KANBAN_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="w-[232px] flex-shrink-0 bg-[#F0EBDA] rounded-xl p-[10px]"
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (dragId) { updateStatus.mutate({ id: dragId, status: col.id }); setDragId(null) } }}>
                <div className="flex items-center gap-2 mb-[10px] px-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }}/>
                  <span className="text-[12px] font-bold text-[#3F3D34] flex-1">{col.label}</span>
                  <span className="text-[11px] text-[#8A8267] bg-[#E3DCC8] rounded-full px-2 py-[1px] font-semibold">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-6">
                  {colTasks.map(tk => (
                    <div key={tk.id} draggable
                      className="bg-white rounded-[7px] p-[11px_12px] cursor-pointer flex flex-col gap-2 shadow-sm"
                      style={{ border: `1px solid ${tk.is_overdue ? '#EAC8BF' : '#EBE5D4'}`, borderLeft: `3px solid ${col.color}` }}
                      onClick={() => setSelectedId(tk.id)} onDragStart={() => setDragId(tk.id)}>
                      <div className="text-[13px] font-semibold text-[#2B2A24] leading-[1.32]">{tk.title}</div>
                      <div className="flex items-center justify-between">
                        <PrioBadge p={tk.priority}/>
                        <span className="text-[11px] font-semibold" style={{ color: tk.is_overdue ? '#B4452F' : '#9A9279' }}>
                          {tk.deadline ? formatDate(tk.deadline, 'd MMM') : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-[7px] pt-2 border-t border-[#F1ECDC]">
                        <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[9px] font-semibold text-white" style={{ background: avatarColor(tk.assignee_name) }}>
                          {getInitials(tk.assignee_name)}
                        </div>
                        <span className="text-[11px] text-[#7A766B]">{tk.assignee_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tasks.length > 0 && view === 'table' && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#FBF6E9]">
                {['TASK','PIC','DEADLINE','PRIORITY','STATUS'].map(h => (
                  <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(tk => (
                <tr key={tk.id} className="border-t border-[#F1ECDC] cursor-pointer hover:bg-[#FDFAF3]" onClick={() => setSelectedId(tk.id)}>
                  <td className="p-[11px_16px]">
                    <div className="font-semibold text-[#2B2A24]">{tk.title}</div>
                    <div className="text-[11px] text-[#A89F86]">{tk.category}</div>
                  </td>
                  <td className="p-[11px_16px]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold text-white" style={{ background: avatarColor(tk.assignee_name) }}>
                        {getInitials(tk.assignee_name)}
                      </div>
                      <span className="text-[#3F3D34]">{tk.assignee_name}</span>
                    </div>
                  </td>
                  <td className="p-[11px_16px] font-medium" style={{ color: tk.is_overdue ? '#B4452F' : '#3F3D34' }}>
                    {tk.deadline ? formatDate(tk.deadline, 'd MMM yyyy') : '—'}
                  </td>
                  <td className="p-[11px_16px]"><PrioBadge p={tk.priority}/></td>
                  <td className="p-[11px_16px]"><StatusBadge s={tk.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)}/>
          <div className="relative bg-white rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#2B2A24]">Buat Task Baru</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#9A9279] text-xl border-none bg-none cursor-pointer">×</button>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Judul Task *</label>
              <input className={inputCls} placeholder="Nama task..." value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Deskripsi</label>
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Detail task..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Kategori</label>
                <select className={inputCls} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Prioritas</label>
                <select className={inputCls} value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">PIC *</label>
                <select className={inputCls} value={form.assignee_id}
                  onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                  <option value="">Pilih PIC...</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Deadline</label>
                <input className={inputCls} type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}/>
              </div>
            </div>
            {formErr && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-2">{formErr}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 bg-[#EFEAD9] text-[#5A574C] border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer">
                Batal
              </button>
              <button onClick={handleCreate} disabled={createTask.isPending}
                className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-50">
                {createTask.isPending ? 'Menyimpan...' : 'Buat Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      {selectedId && selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/[.28]" onClick={() => setSelectedId(null)}/>
          <div className="absolute top-0 right-0 w-[430px] max-w-[92vw] h-full bg-[#FBF8EE] shadow-xl p-[22px] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8A8267] bg-[#EFEAD9] rounded-full px-[10px] py-[3px]">{selected.category}</span>
              <button onClick={() => setSelectedId(null)} className="bg-none border-none cursor-pointer text-[#9A9279] text-[20px] leading-none">×</button>
            </div>
            <div className="text-[18px] font-bold text-[#2B2A24] leading-[1.3]">{selected.title}</div>
            <div className="flex gap-2"><StatusBadge s={selected.status}/><PrioBadge p={selected.priority}/></div>
            <div className="grid grid-cols-2 gap-[14px] p-[14px] bg-[#FCFAF2] border border-[#EFE9D8] rounded-lg">
              <div>
                <div className="text-[11px] text-[#A89F86] mb-[5px]">PIC</div>
                <div className="flex items-center gap-[7px]">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold text-white" style={{ background: avatarColor(selected.assignee_name) }}>
                    {getInitials(selected.assignee_name)}
                  </div>
                  <span className="text-[13px] font-semibold text-[#2B2A24]">{selected.assignee_name}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#A89F86] mb-[5px]">Deadline</div>
                <div className="text-[13px] font-semibold text-[#2B2A24]">{selected.deadline ? formatDate(selected.deadline, 'd MMM yyyy') : 'Tanpa deadline'}</div>
              </div>
            </div>
            {selected.description && (
              <div>
                <div className="text-[12px] font-semibold text-[#5A574C] mb-[6px]">Deskripsi</div>
                <div className="text-[13px] text-[#5A574C] leading-[1.55]">{selected.description}</div>
              </div>
            )}
            {selected.revision_notes && (
              <div className="p-3 bg-[#FBF4EC] border border-[#EFE2D2] rounded-lg">
                <div className="text-[11px] font-semibold text-[#C77B3C] mb-1">Catatan Revisi</div>
                <div className="text-[12px] text-[#5A574C]">{selected.revision_notes}</div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => updateStatus.mutate({ id: selected.id, status: 'in_progress' })}
                className="flex-1 bg-white border border-[#D9E0D4] text-[#4F7CAC] rounded-md py-[9px] text-[12px] font-semibold cursor-pointer">
                In Progress
              </button>
              <button onClick={() => { updateStatus.mutate({ id: selected.id, status: 'done' }); setSelectedId(null) }}
                className="flex-1 bg-[#5E7A5C] border-none text-white rounded-md py-[9px] text-[12px] font-semibold cursor-pointer">
                Tandai Selesai
              </button>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[#5A574C] mb-[10px]">Komentar</div>
              <div className="flex flex-col gap-3 mb-3">
                {commentsQ.isLoading && <div className="text-[12px] text-[#A89F86]">Memuat...</div>}
                {(commentsQ.data ?? []).length === 0 && !commentsQ.isLoading && (
                  <div className="text-[12px] text-[#A89F86]">Belum ada komentar.</div>
                )}
                {(commentsQ.data ?? []).map(c => (
                  <div key={c.id} className="flex gap-[9px]">
                    <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0" style={{ background: avatarColor(c.user_name) }}>
                      {getInitials(c.user_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-[7px]">
                        <span className="text-[12px] font-semibold text-[#2B2A24]">{c.user_name}</span>
                        <span className="text-[10px] text-[#B0A78C]">{formatDate(c.created_at, 'd MMM')}</span>
                      </div>
                      <div className="text-[12px] text-[#5A574C] mt-[2px]">{c.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="Tulis komentar..."
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleComment() }}/>
                <button onClick={handleComment} disabled={!commentText.trim() || addComment.isPending}
                  className="bg-[#5E7A5C] text-white border-none rounded-md px-3 text-[12px] font-semibold cursor-pointer disabled:opacity-40">
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

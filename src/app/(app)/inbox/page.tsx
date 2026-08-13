'use client'

import { useMemo, useState } from 'react'
import {
  useReplizComments, useReplyComment, useMarkCommentStatus, type CommentStatus,
  useReplizChats, useSendChatMessage,
  type ReplizComment, type ReplizChat,
} from '@/lib/queries/replizInbox'
import { useInboxMeta, useSetAssignee, type InboxMeta, type MetaTable } from '@/lib/queries/inboxMeta'
import { useTeamUsers, type UserWithRole } from '@/lib/queries/settings'
import { useApp } from '@/contexts/AppContext'
import { formatDateTime, getInitials } from '@/lib/utils'

type AssigneeFilter = 'all' | 'mine' | 'unassigned'

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads',
  tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', shopee: 'Shopee',
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  video: 'Reels', reel: 'Reels', album: 'Album', carousel: 'Album',
  image: 'Image', text: 'Text', story: 'Story', link: 'Link',
}

const STATUS_META: Record<CommentStatus, { label: string; c: string; bg: string }> = {
  pending:  { label: 'Pending',  c: '#C77B3C', bg: '#F8EEE2' },
  resolved: { label: 'Resolved', c: '#5E8C61', bg: '#E9F3EA' },
  ignored:  { label: 'Ignored',  c: '#9A9279', bg: '#EFEAD9' },
}

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[8px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

function Avatar({ name, picture }: { name: string; picture: string | null }) {
  if (picture) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={picture} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
      style={{ background: avatarColor(name) }}>
      {getInitials(name)}
    </div>
  )
}

function AssigneeBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] text-[10px] font-semibold text-white rounded-full pl-[3px] pr-[8px] py-[2px]"
      style={{ background: avatarColor(name) }}>
      <span className="w-[16px] h-[16px] rounded-full bg-white/25 flex items-center justify-center text-[8px]">{getInitials(name)}</span>
      {name}
    </span>
  )
}

function AssignControl({ id, table, meta, teamUsers, currentUserId, isLeader }: {
  id: string; table: MetaTable; meta: InboxMeta | undefined
  teamUsers: UserWithRole[]; currentUserId: string | null; isLeader: boolean
}) {
  const setAssignee = useSetAssignee(table)
  const assigneeId = meta?.assigneeId ?? null
  const canUnassign = isLeader || assigneeId === currentUserId

  return (
    <select
      value={assigneeId ?? ''}
      onChange={e => setAssignee.mutate({ id, assigneeId: e.target.value || null })}
      disabled={setAssignee.isPending}
      title={assigneeId ? undefined : 'Assign ke anggota tim'}
      className="text-[10.5px] font-semibold text-[#5A574C] bg-white border border-[#E3DCC8] rounded-md px-[7px] py-[3px] cursor-pointer focus:outline-none disabled:opacity-50 max-w-[160px]">
      <option value="" disabled={!!assigneeId && !canUnassign}>
        {assigneeId ? '— Unassign —' : 'Assign ke...'}
      </option>
      {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
    </select>
  )
}

function ReplyBox({ placeholder, onSend, pending }: { placeholder: string; onSend: (text: string) => void; pending: boolean }) {
  const [text, setText] = useState('')
  function submit() {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }
  return (
    <div className="flex items-center gap-[8px] mt-[10px]">
      <input className={inputCls} placeholder={placeholder} value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !pending) submit() }}/>
      <button onClick={submit} disabled={pending || !text.trim()}
        className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[8px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
        {pending ? '...' : 'Kirim'}
      </button>
    </div>
  )
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="p-6 text-center text-[13px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-lg">
      Gagal memuat: {message}
      {message.toLowerCase().includes('belum di-set') && (
        <div className="mt-1 text-[11px] text-[#9A9279]">Repliz belum dikonfigurasi (REPLIZ_ACCESS_KEY / REPLIZ_SECRET_KEY).</div>
      )}
    </div>
  )
}

// ─── Komentar ─────────────────────────────────────────────────
function PostContext({ content, platform }: { content: ReplizComment['content']; platform: string }) {
  const typeLabel = content.type ? (CONTENT_TYPE_LABEL[content.type] ?? content.type) : null
  const igLink = platform === 'instagram' && content.id ? `https://www.instagram.com/p/${content.id}/` : null

  if (!content.thumbnail && !content.title && !typeLabel) return null

  const body = (
    <div className="flex items-center gap-2 mt-[6px] min-w-0">
      {content.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content.thumbnail} alt="" className="w-[40px] h-[40px] rounded-md object-cover flex-shrink-0 border border-[#EBE5D4]" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          {typeLabel && (
            <span className="text-[9px] font-bold text-[#4F7CAC] bg-[#E8F0F6] rounded px-[6px] py-[1px] flex-shrink-0">
              {typeLabel}
            </span>
          )}
          <span className="text-[11px] text-[#9A9279] truncate">
            {content.title ? `pada: ${content.title}` : 'pada: (postingan tanpa caption)'}
          </span>
        </div>
      </div>
    </div>
  )

  if (!igLink) return body
  return (
    <a href={igLink} target="_blank" rel="noopener noreferrer"
      className="no-underline hover:opacity-80 transition-opacity block">
      {body}
    </a>
  )
}

function CommentCard({ comment, meta, teamUsers, currentUserId, isLeader }: {
  comment: ReplizComment; meta: InboxMeta | undefined
  teamUsers: UserWithRole[]; currentUserId: string | null; isLeader: boolean
}) {
  const replyMut = useReplyComment()
  const markMut = useMarkCommentStatus()
  const [sent, setSent] = useState(false)
  const [statusWarning, setStatusWarning] = useState<string | null>(null)

  function handleSend(text: string) {
    replyMut.mutate({ commentId: comment.id, text }, {
      onSuccess: (res) => {
        setSent(true)
        if (res.statusError) setStatusWarning(res.statusError)
      },
    })
  }

  const resolvedByUser = meta?.resolvedBy ? teamUsers.find(u => u.id === meta.resolvedBy) : undefined
  const assigneeUser = meta?.assigneeId ? teamUsers.find(u => u.id === meta.assigneeId) : undefined

  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar name={comment.authorName} picture={comment.authorPicture} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#2B2A24]">{comment.authorName}</span>
            <span className="text-[10px] font-semibold text-[#5A574C] bg-[#F0EBDA] rounded-full px-[8px] py-[2px]">
              {PLATFORM_LABEL[comment.platform] ?? comment.platform} · {comment.accountName}
            </span>
            {comment.createdAt && <span className="text-[11px] text-[#A89F86]">{formatDateTime(comment.createdAt)}</span>}
            {assigneeUser && <AssigneeBadge name={assigneeUser.name} />}
            <div className="ml-auto">
              <AssignControl id={comment.id} table="repliz_comment_meta" meta={meta} teamUsers={teamUsers}
                currentUserId={currentUserId} isLeader={isLeader} />
            </div>
          </div>
          <PostContext content={comment.content} platform={comment.platform} />
          <div className="text-[13px] text-[#3F3D34] mt-[6px]">{comment.text || <em className="text-[#A89F86]">(tanpa teks)</em>}</div>

          {comment.status === 'pending' && (
            sent ? (
              <div className="mt-[10px]">
                <div className="text-[12px] text-[#5E8C61] font-semibold">✓ Balasan terkirim</div>
                {statusWarning && <div className="text-[11px] text-[#C77B3C] mt-[2px]">Status belum ter-update: {statusWarning}</div>}
              </div>
            ) : (
              <>
                <ReplyBox placeholder="Tulis balasan..." onSend={handleSend} pending={replyMut.isPending} />
                {replyMut.isError && <div className="text-[11px] text-[#B4452F] mt-[4px]">{(replyMut.error as Error).message}</div>}
                <button onClick={() => markMut.mutate({ commentId: comment.id, status: 'resolved' })}
                  disabled={markMut.isPending}
                  className="text-[11px] font-semibold text-[#4F7CAC] bg-none border-none cursor-pointer hover:underline mt-[6px] disabled:opacity-50">
                  {markMut.isPending ? 'Menandai...' : 'Tandai selesai (tanpa balas)'}
                </button>
                {markMut.isError && <div className="text-[11px] text-[#B4452F] mt-[4px]">{(markMut.error as Error).message}</div>}
              </>
            )
          )}

          {comment.status === 'resolved' && resolvedByUser && (
            <div className="text-[11px] text-[#5E8C61] font-semibold mt-[8px]">
              ✓ dibalas oleh {resolvedByUser.name}{meta?.resolvedAt ? ` • ${formatDateTime(meta.resolvedAt)}` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ASSIGNEE_FILTERS: { value: AssigneeFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'mine', label: 'Milik saya' },
  { value: 'unassigned', label: 'Belum di-assign' },
]

function CommentsTab() {
  const { userId, isLeader } = useApp()
  const [status, setStatus] = useState<CommentStatus>('pending')
  const [page, setPage] = useState(1)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all')
  const q = useReplizComments(status, page)
  const teamUsersQ = useTeamUsers()
  const teamUsers = teamUsersQ.data ?? []

  const comments = useMemo(() => q.data?.comments ?? [], [q.data])
  const metaQ = useInboxMeta('repliz_comment_meta', comments.map(c => c.id))
  const meta = metaQ.data

  const filtered = useMemo(() => {
    if (assigneeFilter === 'all' || !meta) return comments
    return comments.filter(c => {
      const a = meta?.[c.id]?.assigneeId ?? null
      return assigneeFilter === 'mine' ? a === userId : a === null
    })
  }, [comments, meta, assigneeFilter, userId])

  function changeStatus(s: CommentStatus) {
    setStatus(s)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
          {(Object.keys(STATUS_META) as CommentStatus[]).map(s => (
            <button key={s} onClick={() => changeStatus(s)}
              className={`px-[13px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${status === s ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`}>
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
        <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
          {ASSIGNEE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setAssigneeFilter(f.value)}
              className={`px-[13px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${assigneeFilter === f.value ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {(() => {
        const hasNextPage = q.data?.hasNextPage ?? false
        if (q.isError) return <ErrorNotice message={(q.error as Error).message} />
        if (!q.data) return <div className="p-8 text-center text-[13px] text-[#9A9279] bg-white border border-[#EBE5D4] rounded-lg">Memuat komentar...</div>
        if (comments.length === 0) return (
          <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">
            Tidak ada komentar dengan status &quot;{STATUS_META[status].label}&quot;.
          </div>
        )
        if (filtered.length === 0) return (
          <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">
            Tidak ada komentar yang cocok dengan filter ini di halaman sekarang.
          </div>
        )
        return (
          <>
            <div className="flex flex-col gap-3">
              {filtered.map(c => (
                <CommentCard key={c.id} comment={c} meta={meta?.[c.id]} teamUsers={teamUsers}
                  currentUserId={userId} isLeader={isLeader} />
              ))}
            </div>
            {hasNextPage && (
              <button onClick={() => setPage(p => p + 1)}
                className="self-center text-[12px] font-semibold text-[#4F7CAC] bg-none border-none cursor-pointer hover:underline py-2">
                Muat lebih banyak
              </button>
            )}
          </>
        )
      })()}
    </div>
  )
}

// ─── Chat ─────────────────────────────────────────────────────
function ChatCard({ chat, meta, teamUsers, currentUserId, isLeader }: {
  chat: ReplizChat; meta: InboxMeta | undefined
  teamUsers: UserWithRole[]; currentUserId: string | null; isLeader: boolean
}) {
  const sendMut = useSendChatMessage()
  const [sentText, setSentText] = useState<string | null>(null)
  const assigneeUser = meta?.assigneeId ? teamUsers.find(u => u.id === meta.assigneeId) : undefined

  function handleSend(text: string) {
    sendMut.mutate({ chatId: chat.id, text }, { onSuccess: () => setSentText(text) })
  }

  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar name={chat.senderName} picture={chat.senderPicture} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#2B2A24]">{chat.senderName}</span>
            <span className="text-[10px] font-semibold text-[#5A574C] bg-[#F0EBDA] rounded-full px-[8px] py-[2px]">
              {PLATFORM_LABEL[chat.platform] ?? chat.platform} · {chat.accountName}
            </span>
            {chat.unreadCount > 0 && (
              <span className="text-[10px] font-bold text-white bg-[#C2795A] rounded-full px-[7px] py-[2px]">{chat.unreadCount} baru</span>
            )}
            {chat.lastMessageAt && <span className="text-[11px] text-[#A89F86]">{formatDateTime(chat.lastMessageAt)}</span>}
            {assigneeUser && <AssigneeBadge name={assigneeUser.name} />}
            <div className="ml-auto">
              <AssignControl id={chat.id} table="repliz_chat_meta" meta={meta} teamUsers={teamUsers}
                currentUserId={currentUserId} isLeader={isLeader} />
            </div>
          </div>
          <div className="text-[13px] text-[#3F3D34] mt-[6px] truncate">{chat.lastMessageText || <em className="text-[#A89F86]">(tanpa pesan)</em>}</div>

          <ReplyBox placeholder="Tulis pesan..." onSend={handleSend} pending={sendMut.isPending} />
          {sentText && <div className="text-[12px] text-[#5E8C61] font-semibold mt-[6px]">✓ Terkirim: &quot;{sentText}&quot;</div>}
          {sendMut.isError && <div className="text-[11px] text-[#B4452F] mt-[4px]">{(sendMut.error as Error).message}</div>}
        </div>
      </div>
    </div>
  )
}

function ChatTab() {
  const { userId, isLeader } = useApp()
  const [page, setPage] = useState(1)
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all')
  const q = useReplizChats(page)
  const teamUsersQ = useTeamUsers()
  const teamUsers = teamUsersQ.data ?? []

  const chats = useMemo(() => q.data?.chats ?? [], [q.data])
  const metaQ = useInboxMeta('repliz_chat_meta', chats.map(c => c.id))
  const meta = metaQ.data

  const filtered = useMemo(() => {
    if (assigneeFilter === 'all' || !meta) return chats
    return chats.filter(c => {
      const a = meta?.[c.id]?.assigneeId ?? null
      return assigneeFilter === 'mine' ? a === userId : a === null
    })
  }, [chats, meta, assigneeFilter, userId])

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px] self-start">
        {ASSIGNEE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setAssigneeFilter(f.value)}
            className={`px-[13px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${assigneeFilter === f.value ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {(() => {
        const hasNextPage = q.data?.hasNextPage ?? false
        if (q.isError) return <ErrorNotice message={(q.error as Error).message} />
        if (!q.data) return <div className="p-8 text-center text-[13px] text-[#9A9279] bg-white border border-[#EBE5D4] rounded-lg">Memuat chat...</div>
        if (chats.length === 0) return <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">Belum ada percakapan.</div>
        if (filtered.length === 0) return <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">Tidak ada chat yang cocok dengan filter ini di halaman sekarang.</div>
        return (
          <>
            <div className="flex flex-col gap-3">
              {filtered.map(c => (
                <ChatCard key={c.id} chat={c} meta={meta?.[c.id]} teamUsers={teamUsers}
                  currentUserId={userId} isLeader={isLeader} />
              ))}
            </div>
            {hasNextPage && (
              <button onClick={() => setPage(p => p + 1)}
                className="self-center text-[12px] font-semibold text-[#4F7CAC] bg-none border-none cursor-pointer hover:underline py-2">
                Muat lebih banyak
              </button>
            )}
          </>
        )
      })()}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────
export default function InboxPage() {
  const [tab, setTab] = useState<'comments' | 'chat'>('comments')

  const segBtn = (active: boolean) =>
    `px-[13px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px] self-start">
        <button className={segBtn(tab === 'comments')} onClick={() => setTab('comments')}>Komentar</button>
        <button className={segBtn(tab === 'chat')} onClick={() => setTab('chat')}>Chat</button>
      </div>

      {tab === 'comments' ? <CommentsTab /> : <ChatTab />}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  useReplizComments, useReplyComment, type CommentStatus,
  useReplizChats, useSendChatMessage,
  type ReplizComment, type ReplizChat,
} from '@/lib/queries/replizInbox'
import { formatDateTime, getInitials } from '@/lib/utils'

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', threads: 'Threads',
  tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', shopee: 'Shopee',
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
function CommentCard({ comment }: { comment: ReplizComment }) {
  const replyMut = useReplyComment()
  const [sent, setSent] = useState(false)

  function handleSend(text: string) {
    replyMut.mutate({ commentId: comment.id, text }, { onSuccess: () => setSent(true) })
  }

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
          </div>
          {comment.contentTitle && (
            <div className="text-[11px] text-[#9A9279] mt-[2px] truncate">pada: {comment.contentTitle}</div>
          )}
          <div className="text-[13px] text-[#3F3D34] mt-[6px]">{comment.text || <em className="text-[#A89F86]">(tanpa teks)</em>}</div>

          {comment.status === 'pending' && (
            sent ? (
              <div className="text-[12px] text-[#5E8C61] font-semibold mt-[10px]">✓ Balasan terkirim</div>
            ) : (
              <>
                <ReplyBox placeholder="Tulis balasan..." onSend={handleSend} pending={replyMut.isPending} />
                {replyMut.isError && <div className="text-[11px] text-[#B4452F] mt-[4px]">{(replyMut.error as Error).message}</div>}
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function CommentsTab() {
  const [status, setStatus] = useState<CommentStatus>('pending')
  const [page, setPage] = useState(1)
  const q = useReplizComments(status, page)

  function changeStatus(s: CommentStatus) {
    setStatus(s)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px] self-start">
        {(Object.keys(STATUS_META) as CommentStatus[]).map(s => (
          <button key={s} onClick={() => changeStatus(s)}
            className={`px-[13px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${status === s ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`}>
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {(() => {
        const comments = q.data?.comments ?? []
        const hasNextPage = q.data?.hasNextPage ?? false
        if (q.isError) return <ErrorNotice message={(q.error as Error).message} />
        if (!q.data) return <div className="p-8 text-center text-[13px] text-[#9A9279] bg-white border border-[#EBE5D4] rounded-lg">Memuat komentar...</div>
        if (comments.length === 0) return (
          <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">
            Tidak ada komentar dengan status &quot;{STATUS_META[status].label}&quot;.
          </div>
        )
        return (
          <>
            <div className="flex flex-col gap-3">
              {comments.map(c => <CommentCard key={c.id} comment={c} />)}
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
function ChatCard({ chat }: { chat: ReplizChat }) {
  const sendMut = useSendChatMessage()
  const [sentText, setSentText] = useState<string | null>(null)

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
  const [page, setPage] = useState(1)
  const q = useReplizChats(page)

  return (
    <div className="flex flex-col gap-3">
      {(() => {
        const chats = q.data?.chats ?? []
        const hasNextPage = q.data?.hasNextPage ?? false
        if (q.isError) return <ErrorNotice message={(q.error as Error).message} />
        if (!q.data) return <div className="p-8 text-center text-[13px] text-[#9A9279] bg-white border border-[#EBE5D4] rounded-lg">Memuat chat...</div>
        if (chats.length === 0) return <div className="p-10 text-center text-[13px] text-[#A89F86] bg-white border border-[#EBE5D4] rounded-lg">Belum ada percakapan.</div>
        return (
          <>
            <div className="flex flex-col gap-3">
              {chats.map(c => <ChatCard key={c.id} chat={c} />)}
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

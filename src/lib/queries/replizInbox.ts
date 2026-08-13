import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recordCommentResolved } from '@/lib/queries/inboxMeta'

type RawRow = Record<string, unknown>

// ─── Komentar ─────────────────────────────────────────────────

export type CommentStatus = 'pending' | 'resolved' | 'ignored'

export interface ReplizCommentContent {
  id: string | null
  title: string | null   // hook — baris pertama dari description
  type: string | null    // video/album/image/dst
  thumbnail: string | null
}

export interface ReplizComment {
  id: string
  status: CommentStatus
  text: string
  authorName: string
  authorPicture: string | null
  accountName: string
  platform: string
  createdAt: string
  content: ReplizCommentContent
}

function mapComment(raw: RawRow): ReplizComment {
  const comment = (raw.comment ?? {}) as RawRow
  const content = (raw.content ?? {}) as RawRow
  const account = (raw.account ?? {}) as RawRow
  const owner = (comment.owner ?? {}) as RawRow
  const medias = (content.medias ?? []) as RawRow[]
  const description = (content.description as string) ?? ''
  const hook = description.split('\n')[0]?.trim() || null
  return {
    id: (raw.id as string) ?? (raw._id as string) ?? '',
    status: (raw.status as CommentStatus) ?? 'pending',
    text: (comment.text as string) ?? '',
    authorName: (owner.name as string) ?? 'Unknown',
    authorPicture: (owner.picture as string) ?? null,
    accountName: (account.name as string) ?? '',
    platform: (account.type as string) ?? '',
    createdAt: (comment.createdAt as string) ?? (raw.createdAt as string) ?? '',
    content: {
      id: (content.id as string) ?? null,
      title: hook,
      type: (content.type as string) ?? null,
      thumbnail: (medias[0]?.thumbnail as string) ?? null,
    },
  }
}

export function useReplizComments(status: CommentStatus, page = 1) {
  return useQuery({
    queryKey: ['repliz-comments', status, page],
    queryFn: async (): Promise<{ comments: ReplizComment[]; hasNextPage: boolean; totalDocs: number }> => {
      const res = await fetch(`/api/repliz/comments?page=${page}&limit=20&status=${status}`)
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      const docs = (body.docs ?? []) as RawRow[]
      return { comments: docs.map(mapComment), hasNextPage: !!body.hasNextPage, totalDocs: body.totalDocs ?? 0 }
    },
    retry: 1,
    networkMode: 'always',
  })
}

export function useReplyComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      const res = await fetch('/api/repliz/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, text }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      return body as { commentId: string; status: CommentStatus; statusError?: string }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['repliz-comments'] })
      if (res.status === 'resolved') {
        recordCommentResolved(res.commentId).finally(() =>
          qc.invalidateQueries({ queryKey: ['repliz_comment_meta', 'meta'] })
        )
      }
    },
  })
}

/** Tandai komentar selesai/diabaikan tanpa membalas */
export function useMarkCommentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: CommentStatus }) => {
      const res = await fetch('/api/repliz/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, status }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      return body as { commentId: string; status: CommentStatus }
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['repliz-comments'] })
      if (vars.status === 'resolved') {
        recordCommentResolved(vars.commentId).finally(() =>
          qc.invalidateQueries({ queryKey: ['repliz_comment_meta', 'meta'] })
        )
      }
    },
  })
}

// ─── Chat / DM ────────────────────────────────────────────────

export interface ReplizChat {
  id: string
  senderName: string
  senderPicture: string | null
  lastMessageText: string
  lastMessageAt: string | null
  unreadCount: number
  accountName: string
  platform: string
}

function mapChat(raw: RawRow): ReplizChat {
  const account = (raw.account ?? {}) as RawRow
  const lastMessage = (raw.lastMessage ?? {}) as RawRow
  return {
    id: (raw.id as string) ?? (raw._id as string) ?? '',
    senderName: (raw.senderName as string) ?? 'Unknown',
    senderPicture: (raw.senderPicture as string) ?? null,
    lastMessageText: (lastMessage.text as string) ?? '',
    lastMessageAt: (lastMessage.sendAt as string) ?? null,
    unreadCount: (raw.unreadCount as number) ?? 0,
    accountName: (account.name as string) ?? '',
    platform: (account.type as string) ?? '',
  }
}

export function useReplizChats(page = 1) {
  return useQuery({
    queryKey: ['repliz-chats', page],
    queryFn: async (): Promise<{ chats: ReplizChat[]; hasNextPage: boolean; totalDocs: number }> => {
      const res = await fetch(`/api/repliz/chats?page=${page}&limit=20`)
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      const docs = (body.docs ?? []) as RawRow[]
      return { chats: docs.map(mapChat), hasNextPage: !!body.hasNextPage, totalDocs: body.totalDocs ?? 0 }
    },
    retry: 1,
    networkMode: 'always',
  })
}

export function useSendChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ chatId, text }: { chatId: string; text: string }) => {
      const res = await fetch('/api/repliz/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      return body
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repliz-chats'] }),
  })
}

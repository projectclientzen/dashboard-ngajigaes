import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

type RawRow = Record<string, unknown>

export type MetaTable = 'repliz_comment_meta' | 'repliz_chat_meta'

export interface InboxMeta {
  id: string // comment_id atau chat_id
  assigneeId: string | null
  resolvedBy: string | null
  resolvedAt: string | null
}

function idColumn(table: MetaTable) {
  return table === 'repliz_comment_meta' ? 'comment_id' : 'chat_id'
}

/** Batch-fetch meta (assignment + riwayat resolve) untuk sekumpulan id yang sedang tampil di layar. */
export function useInboxMeta(table: MetaTable, ids: string[]) {
  const sortedIds = [...ids].sort()
  return useQuery({
    queryKey: [table, 'meta', sortedIds],
    queryFn: async (): Promise<Record<string, InboxMeta>> => {
      if (sortedIds.length === 0) return {}
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const col = idColumn(table)
      const { data, error } = await sb.from(table).select('*').in(col, sortedIds)
      if (error) throw error
      const map: Record<string, InboxMeta> = {}
      for (const row of (data ?? []) as RawRow[]) {
        const id = row[col] as string
        map[id] = {
          id,
          assigneeId: (row.assignee_id as string) ?? null,
          resolvedBy: (row.resolved_by as string) ?? null,
          resolvedAt: (row.resolved_at as string) ?? null,
        }
      }
      return map
    },
    enabled: sortedIds.length > 0,
  })
}

/** Assign / reassign / unassign satu komentar atau chat. */
export function useSetAssignee(table: MetaTable) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string | null }) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const col = idColumn(table)
      const { error } = await sb
        .from(table)
        .upsert({ [col]: id, assignee_id: assigneeId, updated_at: new Date().toISOString() }, { onConflict: col })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table, 'meta'] }),
  })
}

/** Catat siapa & kapan komentar ditandai resolved — dipanggil setelah balas / tandai selesai sukses. */
export async function recordCommentResolved(commentId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  await sb.from('repliz_comment_meta').upsert(
    { comment_id: commentId, resolved_by: user.id, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'comment_id' }
  )
}

/** Jumlah komentar pending untuk badge sidebar — leader lihat total, member lihat yang di-assign ke dirinya.
 *  Dibatasi ke 50 komentar pending pertama (pragmatis — Repliz tidak mendukung filter assignee di API-nya). */
export function useInboxPendingBadge(userId: string | null, isLeader: boolean) {
  return useQuery({
    queryKey: ['inbox-pending-badge', userId, isLeader],
    queryFn: async (): Promise<number> => {
      const res = await fetch('/api/repliz/comments?page=1&limit=50&status=pending')
      const body = await res.json().catch(() => null)
      if (!res.ok) return 0
      const docs = (body?.docs ?? []) as RawRow[]
      if (isLeader) return (body?.totalDocs as number) ?? docs.length
      if (!userId) return 0
      const ids = docs.map(d => ((d.id as string) ?? (d._id as string)) ?? '').filter(Boolean)
      if (ids.length === 0) return 0
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data } = await sb.from('repliz_comment_meta').select('comment_id, assignee_id').in('comment_id', ids)
      return ((data ?? []) as RawRow[]).filter(r => r.assignee_id === userId).length
    },
    retry: 1,
    networkMode: 'always',
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  })
}

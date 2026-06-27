import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'

export interface ExtraTask {
  id: string
  title: string
  note: string | null
  assignee_id: string
  assignee_name: string
  created_by: string
  created_by_name: string
  status: 'pending' | 'in_progress' | 'done'
  created_at: string
  updated_at: string
}

type RawRow = Record<string, unknown>

export function useExtraTasks(assigneeId?: string) {
  return useQuery({
    queryKey: ['extra-tasks', assigneeId],
    queryFn: async (): Promise<ExtraTask[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('extra_tasks_view')
        .select('*')
        .order('created_at', { ascending: false })
      if (assigneeId) q = q.eq('assignee_id', assigneeId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map(r => ({
        id: r.id as string,
        title: r.title as string,
        note: r.note as string | null,
        assignee_id: r.assignee_id as string,
        assignee_name: r.assignee_name as string,
        created_by: r.created_by as string,
        created_by_name: r.created_by_name as string,
        status: r.status as ExtraTask['status'],
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      }))
    },
  })
}

export function useCreateExtraTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { title: string; note?: string; assignee_id: string; created_by: string }) => {
      const { error } = await db().from('extra_tasks').insert(payload)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extra-tasks'] }),
  })
}

export function useUpdateExtraTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ExtraTask['status'] }) => {
      const { error } = await db().from('extra_tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['extra-tasks'] }),
  })
}

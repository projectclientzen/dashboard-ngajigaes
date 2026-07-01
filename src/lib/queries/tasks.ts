import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { Task, TaskComment, TaskStatus } from '@/types'

type RawRow = Record<string, unknown>

// userId: jika diisi → tampil task yg di-assign KE user ATAU dibuat OLEH user
// undefined → tampil semua (untuk leader)
export function useTasks(userId?: string) {
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: async (): Promise<Task[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('tasks_view')
        .select('*, assignee:users!tasks_assignee_id_fkey(name)')
        .order('created_at', { ascending: false })

      // Member: lihat task yg di-assign ke mereka ATAU yang mereka buat
      if (userId) q = q.or(`assignee_id.eq.${userId},created_by.eq.${userId}`)

      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error

      return (data ?? []).map((t) => ({
        id: t.id as string,
        title: t.title as string,
        description: t.description as string | null,
        category: t.category as string,
        assignee_id: t.assignee_id as string,
        assignee_name: (t.assignee as { name: string } | null)?.name ?? 'Unknown',
        created_by: t.created_by as string,
        status: t.status as TaskStatus,
        priority: t.priority as Task['priority'],
        deadline: t.deadline as string | null,
        completed_at: t.completed_at as string | null,
        is_overdue: (t.is_overdue as boolean) ?? false,
        result_link: t.result_link as string | null,
        revision_notes: t.revision_notes as string | null,
        created_at: t.created_at as string,
        updated_at: t.updated_at as string,
      })) as Task[]
    },
  })
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async (): Promise<TaskComment[]> => {
      if (!taskId) return []
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('task_comments')
        .select('*, user:users(name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }) as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((c) => ({
        id: c.id as string,
        task_id: c.task_id as string,
        user_id: c.user_id as string,
        user_name: (c.user as { name: string } | null)?.name ?? 'Unknown',
        comment: c.comment as string,
        created_at: c.created_at as string,
      })) as TaskComment[]
    },
    enabled: !!taskId,
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const update: Record<string, unknown> = { status }
      if (status === 'done') update.completed_at = new Date().toISOString()
      const { error } = await db().from('tasks').update(update).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task: {
      title: string; description?: string; category: string
      assignee_id: string; created_by: string; priority: string
      deadline?: string
    }) => {
      const { error } = await db().from('tasks').insert(task)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: {
      id: string
      result_link?: string | null
      deadline?: string | null
      status?: TaskStatus
      revision_notes?: string | null
    }) => {
      const { error } = await db().from('tasks').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, userId, comment }: { taskId: string; userId: string; comment: string }) => {
      const { error } = await db().from('task_comments').insert({
        task_id: taskId, user_id: userId, comment,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['task-comments', v.taskId] }),
  })
}

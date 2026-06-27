import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Content, ContentStatus, ContentFormat, ContentObjective, ValidationStatus } from '@/types'

type RawRow = Record<string, unknown>

export function useContents(start?: string, end?: string) {
  return useQuery({
    queryKey: ['contents', start, end],
    queryFn: async (): Promise<Content[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('contents')
        .select('*, pic:users!contents_pic_id_fkey(name)')
        .order('publish_date', { ascending: false })

      if (start) q = q.gte('publish_date', start)
      if (end) q = q.lte('publish_date', end)

      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error

      return (data ?? []).map((c) => ({
        id: c.id as string,
        title: c.title as string,
        format: c.format as ContentFormat,
        theme: c.theme as string | null,
        objective: c.objective as ContentObjective,
        status: c.status as ContentStatus,
        pic_id: c.pic_id as string,
        pic_name: (c.pic as { name: string } | null)?.name ?? '—',
        publish_date: c.publish_date as string | null,
        asset_link: c.asset_link as string | null,
        post_link: c.post_link as string | null,
        caption: c.caption as string | null,
        hook: c.hook as string | null,
        cta: c.cta as string | null,
        curator_notes: c.curator_notes as string | null,
        validation_status: c.validation_status as ValidationStatus,
        task_id: c.task_id as string | null,
      }))
    },
  })
}

export function useCreateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      format: ContentFormat
      objective: ContentObjective
      status: ContentStatus
      pic_id: string
      theme?: string
      publish_date?: string
      caption?: string
      hook?: string
      cta?: string
      asset_link?: string
    }) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('contents').insert({
        ...payload,
        validation_status: 'not_needed',
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contents'] }),
  })
}

export function useUpdateContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Content> & { id: string }) => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('contents').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contents'] }),
  })
}

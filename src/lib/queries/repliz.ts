import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ReplizAccountItem {
  id: string
  name: string
  platform: string
}

export function useReplizAccounts() {
  return useQuery({
    queryKey: ['repliz-accounts'],
    queryFn: async (): Promise<ReplizAccountItem[]> => {
      const res = await fetch('/api/repliz/accounts')
      if (!res.ok) {
        const b = await res.json().catch(() => null)
        throw new Error(b?.error ?? `HTTP ${res.status}`)
      }
      const body = await res.json()
      const list = (body.data ?? body.accounts ?? body) as Record<string, unknown>[]
      if (!Array.isArray(list)) return []
      return list.map(a => ({
        id: (a._id as string) ?? (a.id as string) ?? '',
        name: (a.name as string) ?? (a.username as string) ?? 'Akun',
        platform: (a.platform as string) ?? '',
      })).filter(a => a.id)
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useScheduleToRepliz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { content_id: string; account_id: string; media_urls?: string[] }) => {
      const res = await fetch('/api/repliz/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      return body
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contents'] }),
  })
}

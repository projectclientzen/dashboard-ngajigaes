'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { todayJakarta } from '@/lib/utils'

// Cek apakah user sudah isi daily report hari ini
export function useHasFilledToday(userId: string | null) {
  return useQuery({
    queryKey: ['daily-filled-today', userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return true // tidak perlu alert jika belum login
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data } = await sb
        .from('daily_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('report_date', todayJakarta())
        .maybeSingle()
      return !!data
    },
    enabled: !!userId,
    // Refresh setiap 5 menit
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  })
}

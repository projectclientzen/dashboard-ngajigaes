import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { SalesRecord, ProductSold, Product } from '@/types'

type RawRow = Record<string, unknown>

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products').select('*').eq('status', 'active').order('name')
      if (error) throw error
      return (data ?? []) as Product[]
    },
  })
}

export function useSalesRecords(start: string, end: string) {
  return useQuery({
    queryKey: ['sales-records', start, end],
    queryFn: async (): Promise<SalesRecord[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      const { data, error } = await sb
        .from('sales_records')
        .select('*, product:products(name)')
        .gte('sales_date', start)
        .lte('sales_date', end)
        .order('sales_date', { ascending: false }) as { data: RawRow[] | null; error: unknown }

      if (error) throw error
      return (data ?? []).map((r) => ({
        id: r.id as string,
        sales_date: r.sales_date as string,
        product_id: r.product_id as string,
        product_name: (r.product as { name: string } | null)?.name ?? 'Produk',
        order_count: r.order_count as number,
        quantity: r.quantity as number,
        product_price: r.product_price as number,
        gross_revenue: (r.gross_revenue as number) ?? 0,
        discount: r.discount as number,
        net_revenue: (r.net_revenue as number) ?? 0,
        source: r.source as SalesRecord['source'],
        channel: r.channel as string | null,
        notes: r.notes as string | null,
      })) as SalesRecord[]
    },
  })
}

export function useProductSold(start: string, end: string) {
  return useQuery({
    queryKey: ['product-sold', start, end],
    queryFn: async (): Promise<ProductSold[]> => {
      const { data, error } = await db().rpc('get_product_sold', {
        p_start: start, p_end: end,
      })
      if (error) throw error
      return (data ?? []) as ProductSold[]
    },
  })
}

export function useCreateSalesRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: {
      sales_date: string; product_id: string; order_count: number
      quantity: number; product_price: number; discount?: number
      source: string; channel?: string; notes?: string
    }) => {
      const { error } = await db().from('sales_records').insert(record)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-records'] }),
  })
}

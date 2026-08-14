import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, db } from '@/lib/supabase/client'
import type { ScalevOrder, ScalevProduct, ManualSale, MetaAdsDailySpend, CampaignSnapshot } from '@/types'

type RawRow = Record<string, unknown>

function mapScalevOrder(r: RawRow): ScalevOrder {
  return {
    id: r.id as string,
    order_id: r.order_id as string,
    scalev_id: r.scalev_id as string,
    customer_name: (r.customer_name as string) ?? null,
    status: r.status as string,
    gross_revenue: (r.gross_revenue as number) ?? null,
    net_payment_revenue: (r.net_payment_revenue as number) ?? null,
    payment_fee: (r.payment_fee as number) ?? null,
    scalev_fee: (r.scalev_fee as number) ?? null,
    service_fee: (r.service_fee as number) ?? null,
    payment_method: (r.payment_method as string) ?? null,
    order_date: r.order_date as string,
    is_spam: !!r.is_spam,
    brand_id: r.brand_id as string,
    synced_at: (r.synced_at as string) ?? null,
  }
}

/** Order Scalev dalam periode — spam dikecualikan di semua tempat pakai ini. */
export function useScalevOrders(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['scalev-orders', start, end, brandId],
    queryFn: async (): Promise<ScalevOrder[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('scalev_orders')
        .select('*')
        .gte('order_date', start)
        .lte('order_date', end)
        .eq('is_spam', false)
        .order('order_date', { ascending: false })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map(mapScalevOrder)
    },
  })
}

export function useScalevProducts(brandId?: string | 'all') {
  return useQuery({
    queryKey: ['scalev-products', brandId],
    queryFn: async (): Promise<ScalevProduct[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb.from('scalev_products').select('*').eq('status', 'active').order('name')
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((r): ScalevProduct => ({
        id: r.id as string,
        scalev_id: r.scalev_id as string,
        name: r.name as string,
        slug: (r.slug as string) ?? null,
        price: (r.price as number) ?? 0,
        stock: (r.stock as number) ?? null,
        status: r.status as string,
        brand_id: r.brand_id as string,
      }))
    },
  })
}

// ─── Manual sales ("+ Tambah Penjualan") ────────────────────

export function useManualSales(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['manual-sales', start, end, brandId],
    queryFn: async (): Promise<ManualSale[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('performance_manual_sales')
        .select('*')
        .gte('sales_date', start)
        .lte('sales_date', end)
        .order('sales_date', { ascending: false })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((r): ManualSale => ({
        id: r.id as string,
        sales_date: r.sales_date as string,
        product_name: r.product_name as string,
        gross_revenue: r.gross_revenue as number,
        qty: r.qty as number,
        notes: (r.notes as string) ?? null,
        brand_id: r.brand_id as string,
        created_by: (r.created_by as string) ?? null,
        created_at: r.created_at as string,
      }))
    },
  })
}

export function useCreateManualSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      sales_date: string; product_name: string; gross_revenue: number; qty: number
      notes?: string; brand_id: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await db().from('performance_manual_sales').insert({
        ...input, created_by: user?.id ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manual-sales'] }),
  })
}

// ─── Meta Ads ────────────────────────────────────────────────

export function useMetaAdsDailySpend(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['meta-ads-daily', start, end, brandId],
    queryFn: async (): Promise<MetaAdsDailySpend[]> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any
      let q = sb
        .from('meta_ads_daily_spend')
        .select('*')
        .gte('spend_date', start)
        .lte('spend_date', end)
        .order('spend_date', { ascending: true })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error
      return (data ?? []).map((r): MetaAdsDailySpend => ({
        id: r.id as string,
        spend_date: r.spend_date as string,
        spend: (r.spend as number) ?? 0,
        purchases: (r.purchases as number) ?? 0,
        purchase_value: (r.purchase_value as number) ?? 0,
        roas: (r.roas as number) ?? null,
        leads: (r.leads as number) ?? 0,
        campaign_count: (r.campaign_count as number) ?? 0,
        brand_id: r.brand_id as string,
        synced_at: (r.synced_at as string) ?? null,
      }))
    },
  })
}

function mapCampaignSnapshot(r: RawRow): CampaignSnapshot {
  return {
    id: r.id as string,
    campaign_id: r.campaign_id as string,
    campaign_name: r.campaign_name as string,
    level: r.level as string,
    date_start: r.date_start as string,
    date_stop: r.date_stop as string,
    spend: (r.spend as number) ?? null,
    reach: (r.reach as number) ?? null,
    impressions: (r.impressions as number) ?? null,
    clicks: (r.clicks as number) ?? null,
    ctr: (r.ctr as number) ?? null,
    cpm: (r.cpm as number) ?? null,
    purchases: (r.purchases as number) ?? null,
    purchase_value: (r.purchase_value as number) ?? null,
    leads: (r.leads as number) ?? null,
    roas: (r.roas as number) ?? null,
    cpl: (r.cpl as number) ?? null,
    cpp: (r.cpp as number) ?? null,
    status: r.status as string,
    fetched_at: (r.fetched_at as string) ?? null,
    brand_id: r.brand_id as string,
  }
}

export interface CampaignSnapshotResult {
  campaigns: CampaignSnapshot[]
  /** true kalau hasil ini fallback dari snapshot terakhir yang tersedia (bukan dari periode terpilih) */
  isStale: boolean
}

/**
 * Campaign level='campaign', 1 baris terbaru per campaign_id. Kalau tidak ada
 * data di rentang periode terpilih (campaign_snapshots sync-nya lain jadwal
 * dari meta_ads_daily_spend — bisa jauh lebih jarang), fallback ke snapshot
 * terakhir yang tersedia apapun tanggalnya (isStale: true) — supaya tabel
 * tidak kosong padahal ada data historis, tapi tetap jujur soal kebaruannya.
 */
export function useCampaignSnapshots(start: string, end: string, brandId?: string | 'all') {
  return useQuery({
    queryKey: ['campaign-snapshots', start, end, brandId],
    queryFn: async (): Promise<CampaignSnapshotResult> => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      function dedupeLatestPerCampaign(rows: RawRow[]): CampaignSnapshot[] {
        const byId = new Map<string, RawRow>()
        for (const r of rows) {
          const id = r.campaign_id as string
          const existing = byId.get(id)
          if (!existing || (r.date_start as string) > (existing.date_start as string)) byId.set(id, r)
        }
        return Array.from(byId.values()).map(mapCampaignSnapshot).sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0))
      }

      let q = sb.from('campaign_snapshots').select('*').eq('level', 'campaign')
        .gte('date_start', start).lte('date_start', end).order('date_start', { ascending: false })
      if (brandId && brandId !== 'all') q = q.eq('brand_id', brandId)
      const { data, error } = await q as { data: RawRow[] | null; error: unknown }
      if (error) throw error

      if (data && data.length > 0) {
        return { campaigns: dedupeLatestPerCampaign(data), isStale: false }
      }

      // Fallback: snapshot terakhir yang tersedia, tanpa filter tanggal
      let qFallback = sb.from('campaign_snapshots').select('*').eq('level', 'campaign')
        .order('date_start', { ascending: false }).limit(300)
      if (brandId && brandId !== 'all') qFallback = qFallback.eq('brand_id', brandId)
      const { data: fallbackData, error: fbErr } = await qFallback as { data: RawRow[] | null; error: unknown }
      if (fbErr) throw fbErr
      return { campaigns: dedupeLatestPerCampaign(fallbackData ?? []), isStale: true }
    },
  })
}

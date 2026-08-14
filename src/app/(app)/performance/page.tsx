'use client'

import { useMemo, useState } from 'react'
import { AreaChart, Area, LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useApp } from '@/contexts/AppContext'
import {
  useScalevOrders, useScalevProducts, useManualSales, useCreateManualSale,
  useMetaAdsDailySpend, useCampaignSnapshots,
} from '@/lib/queries/performance'
import { formatRupiah, formatDate } from '@/lib/utils'

type Tab = 'omzet' | 'iklan' | 'pnl'

function prevPeriodRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00Z')
  const e = new Date(end + 'T00:00:00Z')
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  const prevEnd = new Date(s.getTime() - 86400000)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000)
  return { start: prevStart.toISOString().split('T')[0], end: prevEnd.toISOString().split('T')[0] }
}

function compactNumber(v: number) {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

// ─── Shared bits ──────────────────────────────────────────────

function KpiCard({ label, value, delta, deltaLabel, valueColor, big = false }: {
  label: string; value: string; delta?: number | null; deltaLabel?: string; valueColor?: string; big?: boolean
}) {
  const deltaColor = delta == null ? '#A89F86' : delta > 0 ? '#5E8C61' : delta < 0 ? '#B4452F' : '#A89F86'
  const deltaText = delta == null ? null : `${delta > 0 ? '▲' : delta < 0 ? '▼' : '•'} ${Math.abs(delta).toFixed(1)}%`
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
      <div className="text-[11.5px] text-[#9A9279] font-medium mb-2 leading-tight">{label}</div>
      <div className={`${big ? 'text-[21px]' : 'text-[20px]'} font-bold tracking-tight`} style={{ color: valueColor ?? '#2B2A24' }}>{value}</div>
      {(deltaText || deltaLabel) && (
        <div className="text-[11.5px] font-semibold mt-[6px]" style={{ color: deltaColor }}>
          {deltaText}{deltaLabel && <span className="text-[#A89F86] font-medium ml-1">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; label?: string
  payload?: { value: number; name: string; color?: string }[]
  formatter: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E3DCC8] rounded-md px-[10px] py-[7px] shadow-md">
      <div className="text-[10px] text-[#9A9279] mb-[3px]">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-[6px] text-[12px]">
          <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#5A574C]">{p.name}</span>
          <span className="font-bold text-[#2B2A24] ml-auto tabular-nums">{formatter(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const SOURCE_BADGE: Record<string, { bg: string; c: string; label: string }> = {
  scalev: { bg: '#EAF0E5', c: '#4C6A4A', label: 'Scalev' },
  manual: { bg: '#F0EBDA', c: '#8A7B54', label: 'Manual' },
}
function SourceBadge({ source }: { source: 'scalev' | 'manual' }) {
  const m = SOURCE_BADGE[source]
  return <span className="text-[10px] font-semibold rounded-[5px] px-[7px] py-[2px] whitespace-nowrap" style={{ background: m.bg, color: m.c }}>{m.label}</span>
}

const STATUS_BADGE: Record<string, { bg: string; c: string; label: string }> = {
  completed: { bg: '#EAF0E5', c: '#4C6A4A', label: 'Completed' },
  pending: { bg: '#FBEFD9', c: '#9A6A20', label: 'Pending' },
}
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_BADGE[status] ?? { bg: '#EEEBE2', c: '#8A857A', label: status }
  return <span className="text-[10px] font-semibold rounded-[5px] px-[7px] py-[2px] whitespace-nowrap">{m.label}</span>
}

// ─── Tab: Omzet & Produk ──────────────────────────────────────

interface SalesRow {
  id: string; date: string; product: string; orderId: string | null
  qty: number | null; gross: number; net: number | null
  source: 'scalev' | 'manual'; status: string
}

function OmzetTab({ brandId, isAllBrands, requireBrandId, rangeStart, rangeEnd, rangeLabel }: {
  brandId: string | 'all'; isAllBrands: boolean; requireBrandId: () => string | null
  rangeStart: string; rangeEnd: string; rangeLabel: string
}) {
  const [showNet, setShowNet] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const ordersQ = useScalevOrders(rangeStart, rangeEnd, brandId)
  const productsQ = useScalevProducts(brandId)
  const manualQ = useManualSales(rangeStart, rangeEnd, brandId)
  const createManual = useCreateManualSale()

  const { start: prevStart, end: prevEnd } = prevPeriodRange(rangeStart, rangeEnd)
  const prevOrdersQ = useScalevOrders(prevStart, prevEnd, brandId)

  const orders = useMemo(() => ordersQ.data ?? [], [ordersQ.data])
  const prevOrders = useMemo(() => prevOrdersQ.data ?? [], [prevOrdersQ.data])
  const manualSales = useMemo(() => manualQ.data ?? [], [manualQ.data])
  const products = productsQ.data ?? []

  const completed = useMemo(() => orders.filter(o => o.status === 'completed'), [orders])
  const prevCompleted = useMemo(() => prevOrders.filter(o => o.status === 'completed'), [prevOrders])

  const grossTotal = completed.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
  const prevGrossTotal = prevCompleted.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
  const totalOrder = completed.length
  const prevTotalOrder = prevCompleted.length
  const aov = totalOrder > 0 ? grossTotal / totalOrder : 0
  const prevAov = prevTotalOrder > 0 ? prevGrossTotal / prevTotalOrder : 0

  const isLoading = ordersQ.isLoading || prevOrdersQ.isLoading

  const kpis = [
    { label: 'Est. Gross Revenue', value: formatRupiah(grossTotal, true), delta: pctDelta(grossTotal, prevGrossTotal) },
    { label: 'Total Order', value: totalOrder.toString(), delta: pctDelta(totalOrder, prevTotalOrder), deltaLabel: 'order' },
    { label: 'AOV', value: formatRupiah(aov), delta: pctDelta(aov, prevAov) },
    {
      label: 'Produk Terjual', value: totalOrder > 0 ? totalOrder.toString() : '—',
      delta: pctDelta(totalOrder, prevTotalOrder), deltaLabel: '≈ order · qty per-produk belum tersedia',
    },
  ]

  // Chart: gross/net per hari
  const dailyData = useMemo(() => {
    const map = new Map<string, { gross: number; net: number }>()
    for (const o of completed) {
      const cur = map.get(o.order_date) ?? { gross: 0, net: 0 }
      cur.gross += o.gross_revenue ?? 0
      cur.net += o.net_payment_revenue ?? o.gross_revenue ?? 0
      map.set(o.order_date, cur)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date: formatDate(date, 'd MMM'), gross: v.gross, net: v.net }))
  }, [completed])

  const omzetTotal = showNet
    ? dailyData.reduce((a, d) => a + d.net, 0)
    : dailyData.reduce((a, d) => a + d.gross, 0)

  // Riwayat: scalev orders + manual, digabung
  const salesRows: SalesRow[] = useMemo(() => {
    const fromScalev: SalesRow[] = orders.map(o => ({
      id: o.id, date: o.order_date, product: `Order ${o.order_id}`, orderId: o.order_id,
      qty: null, gross: o.gross_revenue ?? 0, net: o.net_payment_revenue, source: 'scalev', status: o.status,
    }))
    const fromManual: SalesRow[] = manualSales.map(m => ({
      id: m.id, date: m.sales_date, product: m.product_name, orderId: null,
      qty: m.qty, gross: m.gross_revenue, net: null, source: 'manual', status: 'completed',
    }))
    return [...fromScalev, ...fromManual].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100)
  }, [orders, manualSales])

  const segBtn = (active: boolean) =>
    `px-[12px] py-[5px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`

  async function handleAddSale(form: { product_name: string; gross_revenue: string; qty: string }) {
    const bId = requireBrandId()
    if (!bId) return
    await createManual.mutateAsync({
      sales_date: new Date().toISOString().split('T')[0],
      product_name: form.product_name,
      gross_revenue: Number(form.gross_revenue) || 0,
      qty: Number(form.qty) || 1,
      brand_id: bId,
    })
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid md:grid-cols-[1.55fr_1fr] gap-3">
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-bold text-[#2B2A24]">Omzet per Hari</span>
            <div className="inline-flex bg-[#F0EBDA] rounded-lg p-[3px] gap-[2px]">
              <button className={segBtn(!showNet)} onClick={() => setShowNet(false)}>Gross</button>
              <button className={segBtn(showNet)} onClick={() => setShowNet(true)}>Net</button>
            </div>
          </div>
          <div className="text-[11px] text-[#A89F86] mb-2">{rangeLabel} · total {formatRupiah(omzetTotal, true)}</div>
          {isLoading ? (
            <div className="h-[190px] flex items-center justify-center text-[13px] text-[#9A9279]">Memuat...</div>
          ) : dailyData.length < 1 ? (
            <div className="h-[190px] flex items-center justify-center text-[13px] text-[#9A9279]">Belum ada data harian di periode ini</div>
          ) : (
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7E997B" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#7E997B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1ECDC" />
                  <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    interval="preserveStartEnd" tickMargin={6} />
                  <YAxis width={42} tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    tickFormatter={compactNumber} tickCount={4} />
                  <Tooltip content={<ChartTooltip formatter={v => formatRupiah(v)} />} cursor={{ stroke: '#E3DCC8', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey={showNet ? 'net' : 'gross'} name={showNet ? 'Net' : 'Gross'}
                    stroke="#5E7A5C" strokeWidth={2} fill="url(#omzetGrad)"
                    dot={{ r: 2.5, fill: '#5E7A5C', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-3">Top Produk</div>
          {productsQ.isLoading ? (
            <div className="p-6 text-center text-[13px] text-[#9A9279]">Memuat...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-[13px] text-[#A89F86]">Belum ada produk Scalev tersinkron.</div>
          ) : (
            <>
              <div className="text-[11px] text-[#C77B3C] bg-[#FBF0E4] border border-[#F0DCC2] rounded-md px-[10px] py-[8px] mb-3 leading-snug">
                Belum ada data penjualan per produk — order Scalev belum menyertakan rincian item (ordervariants). Daftar di bawah cuma katalog produk aktif.
              </div>
              <div className="flex flex-col gap-2">
                {products.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 border-t border-[#F1ECDC] pt-2 first:border-t-0 first:pt-0">
                    <span className="text-[12.5px] font-semibold text-[#2B2A24] truncate">{p.name}</span>
                    <span className="text-[12px] text-[#5A574C] whitespace-nowrap">{formatRupiah(p.price, true)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-[14px_16px] border-b border-[#F1ECDC]">
          <span className="text-[13px] font-bold text-[#2B2A24]">Riwayat Penjualan</span>
          <button onClick={() => setShowAdd(true)} disabled={isAllBrands}
            title={isAllBrands ? 'Pilih brand dulu' : undefined}
            className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[8px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-[6px]">
            <span className="text-[15px] leading-none">+</span> Tambah Penjualan
          </button>
        </div>

        {ordersQ.isLoading || manualQ.isLoading ? (
          <div className="p-10 text-center text-[13px] text-[#9A9279]">Memuat...</div>
        ) : salesRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[15px] font-bold text-[#2B2A24] mb-1">Belum ada penjualan</div>
            <div className="text-[13px] text-[#9A9279]">Tidak ada order Scalev atau entry manual di periode ini.</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#FBF6E9]">
                    {['TANGGAL', 'PRODUK', 'ORDER ID', 'QTY', 'GROSS', 'NET', 'SOURCE / STATUS'].map(h => (
                      <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map(r => (
                    <tr key={r.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                      <td className="p-[11px_14px] text-[#7A766B] whitespace-nowrap">{formatDate(r.date, 'd MMM yyyy')}</td>
                      <td className="p-[11px_14px] font-semibold text-[#2B2A24]">{r.product}</td>
                      <td className="p-[11px_14px] text-[#9A9279] text-[11.5px]">{r.orderId ?? '—'}</td>
                      <td className="p-[11px_14px] text-center text-[#5A574C]">{r.qty ?? '—'}</td>
                      <td className="p-[11px_14px] text-right text-[#5A574C]">{formatRupiah(r.gross)}</td>
                      <td className="p-[11px_14px] text-right font-semibold text-[#2B2A24]">{r.net != null ? formatRupiah(r.net) : '—'}</td>
                      <td className="p-[11px_16px]">
                        <div className="flex items-center gap-[6px]">
                          <SourceBadge source={r.source} />
                          <StatusBadge status={r.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden flex flex-col divide-y divide-[#F1ECDC]">
              {salesRows.map(r => (
                <div key={r.id} className="p-[12px_14px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#2B2A24] truncate">{r.product}</div>
                      <div className="text-[11px] text-[#9A9279] mt-[2px]">
                        {formatDate(r.date, 'd MMM')}{r.orderId ? ` · ${r.orderId}` : ''}{r.qty ? ` · ${r.qty} qty` : ''}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[14px] font-bold text-[#2B2A24]">{formatRupiah(r.gross)}</div>
                      {r.net != null && <div className="text-[10.5px] text-[#9A9279]">net {formatRupiah(r.net)}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-[6px]">
                    <SourceBadge source={r.source} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAdd && <AddSaleModal onClose={() => setShowAdd(false)} onSubmit={handleAddSale} pending={createManual.isPending} error={createManual.error as Error | null} />}
    </div>
  )
}

function AddSaleModal({ onClose, onSubmit, pending, error }: {
  onClose: () => void; onSubmit: (f: { product_name: string; gross_revenue: string; qty: string }) => void
  pending: boolean; error: Error | null
}) {
  const [product, setProduct] = useState('')
  const [gross, setGross] = useState('')
  const [qty, setQty] = useState('1')
  const inputCls = 'w-full border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors'

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/[.28]" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[420px] bg-[#FBF8EE] rounded-[16px] shadow-2xl p-5">
        <div className="text-[15px] font-bold text-[#2B2A24] mb-4">Tambah Penjualan Manual</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-semibold text-[#5A574C]">Produk</label>
            <input className={`${inputCls} mt-[5px]`} placeholder="Nama produk" value={product} onChange={e => setProduct(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[12px] font-semibold text-[#5A574C]">Gross (Rp)</label>
              <input className={`${inputCls} mt-[5px]`} type="number" min="0" placeholder="0" value={gross} onChange={e => setGross(e.target.value)} />
            </div>
            <div className="w-[90px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Qty</label>
              <input className={`${inputCls} mt-[5px]`} type="number" min="1" placeholder="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
          </div>
          {error && <div className="text-[11px] text-[#B4452F]">{error.message}</div>}
          <div className="flex gap-2 mt-1">
            <button onClick={onClose} className="flex-1 border border-[#E3DCC8] bg-white text-[#5A574C] rounded-md py-[10px] text-[13px] font-semibold cursor-pointer">Batal</button>
            <button onClick={() => onSubmit({ product_name: product, gross_revenue: gross, qty })}
              disabled={pending || !product.trim() || !gross}
              className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[10px] text-[13px] font-semibold cursor-pointer hover:bg-[#4F6A4D] disabled:opacity-40 disabled:cursor-not-allowed">
              {pending ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Performance Iklan ───────────────────────────────────

function roasColor(roas: number) {
  if (roas >= 1.5) return '#5E8C61'
  if (roas >= 1) return '#C9A227'
  return '#B4452F'
}

function IklanTab({ brandId, rangeStart, rangeEnd, rangeLabel }: {
  brandId: string | 'all'; rangeStart: string; rangeEnd: string; rangeLabel: string
}) {
  const spendQ = useMetaAdsDailySpend(rangeStart, rangeEnd, brandId)
  const { start: prevStart, end: prevEnd } = prevPeriodRange(rangeStart, rangeEnd)
  const prevSpendQ = useMetaAdsDailySpend(prevStart, prevEnd, brandId)
  const campaignsQ = useCampaignSnapshots(rangeStart, rangeEnd, brandId)

  const rows = useMemo(() => spendQ.data ?? [], [spendQ.data])
  const prevRows = useMemo(() => prevSpendQ.data ?? [], [prevSpendQ.data])
  const campaigns = campaignsQ.data?.campaigns ?? []
  const isStale = campaignsQ.data?.isStale ?? false
  const staleDate = isStale && campaigns.length > 0
    ? campaigns.reduce((max, c) => c.date_start > max ? c.date_start : max, campaigns[0].date_start)
    : null

  const purchaseValue = rows.reduce((a, r) => a + r.purchase_value, 0)
  const spend = rows.reduce((a, r) => a + r.spend, 0)
  const goals = rows.reduce((a, r) => a + r.purchases, 0)
  const roas = spend > 0 ? purchaseValue / spend : 0
  const costPerGoal = goals > 0 ? spend / goals : null

  const prevPurchaseValue = prevRows.reduce((a, r) => a + r.purchase_value, 0)
  const prevSpend = prevRows.reduce((a, r) => a + r.spend, 0)
  const prevGoals = prevRows.reduce((a, r) => a + r.purchases, 0)
  const prevRoas = prevSpend > 0 ? prevPurchaseValue / prevSpend : 0
  const prevCostPerGoal = prevGoals > 0 ? prevSpend / prevGoals : null

  // CPC: meta_ads_daily_spend tidak punya clicks — pakai agregat clicks/spend dari campaign_snapshots (bisa stale)
  const cpcSpend = campaigns.reduce((a, c) => a + (c.spend ?? 0), 0)
  const cpcClicks = campaigns.reduce((a, c) => a + (c.clicks ?? 0), 0)
  const cpc = cpcClicks > 0 ? cpcSpend / cpcClicks : null

  const isLoading = spendQ.isLoading || prevSpendQ.isLoading

  const kpis = [
    { label: 'Purchase Value', value: formatRupiah(purchaseValue, true), delta: pctDelta(purchaseValue, prevPurchaseValue) },
    { label: 'Ads Spent', value: formatRupiah(spend, true), delta: pctDelta(spend, prevSpend) },
    { label: 'ROAS', value: roas.toFixed(2), delta: pctDelta(roas, prevRoas), valueColor: rows.length ? roasColor(roas) : undefined },
    { label: 'Cost per Goal', value: costPerGoal != null ? formatRupiah(costPerGoal, true) : '—', delta: costPerGoal != null && prevCostPerGoal != null ? pctDelta(costPerGoal, prevCostPerGoal) : null },
    { label: 'Goals', value: goals.toString(), delta: pctDelta(goals, prevGoals) },
    { label: 'CPC', value: cpc != null ? formatRupiah(cpc) : '—', deltaLabel: cpc != null ? (isStale ? 'dari data campaign lama' : undefined) : 'data klik belum tersedia' },
  ]

  const chartData = useMemo(() => rows.map(r => ({
    date: formatDate(r.spend_date, 'd MMM'), pv: r.purchase_value, spend: r.spend,
  })), [rows])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid md:grid-cols-[1.55fr_1fr] gap-3">
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-bold text-[#2B2A24]">Purchase Value vs Ads Spent</span>
          </div>
          <div className="text-[11px] text-[#A89F86] mb-2">{rangeLabel}</div>
          {isLoading ? (
            <div className="h-[190px] flex items-center justify-center text-[13px] text-[#9A9279]">Memuat...</div>
          ) : chartData.length < 1 ? (
            <div className="h-[190px] flex items-center justify-center text-[13px] text-[#9A9279]">Belum ada data harian di periode ini</div>
          ) : (
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1ECDC" />
                  <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    interval="preserveStartEnd" tickMargin={6} />
                  <YAxis width={42} tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    tickFormatter={compactNumber} tickCount={4} />
                  <Tooltip content={<ChartTooltip formatter={v => formatRupiah(v)} />} cursor={{ stroke: '#E3DCC8', strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7A766B' }} iconType="plainline" iconSize={12} />
                  <Line type="monotone" dataKey="pv" name="Purchase Value" stroke="#5E7A5C" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#5E7A5C', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="spend" name="Ads Spent" stroke="#C2795A" strokeWidth={2} strokeDasharray="5 3"
                    dot={{ r: 2.5, fill: '#C2795A', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-1">Funnel Konversi</div>
          <div className="text-[11px] text-[#A89F86] mb-4">Content Views → Adds to Cart → Checkouts Initiated</div>
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <div className="w-[40px] h-[40px] rounded-lg bg-[#F1ECDC] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A89F86" strokeWidth="1.8"><path d="M3 4h18l-7 9v6l-4 2v-8z" /></svg>
            </div>
            <div className="text-[13px] font-bold text-[#2B2A24]">Belum ada data funnel</div>
            <div className="text-[11.5px] text-[#9A9279] max-w-[240px]">
              meta_ads_daily_spend &amp; campaign_snapshots belum menyimpan content_views / adds_to_cart / checkout_initiated per hari.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="p-[14px_16px] border-b border-[#F1ECDC]">
          <span className="text-[13px] font-bold text-[#2B2A24]">Campaign Aktif</span>
          {isStale && staleDate && (
            <span className="ml-2 text-[10.5px] font-semibold text-[#9A6A20] bg-[#FBEFD9] rounded-full px-[8px] py-[2px]">
              data terakhir {formatDate(staleDate, 'd MMM yyyy')} — belum ada snapshot campaign di periode ini
            </span>
          )}
        </div>

        {campaignsQ.isLoading ? (
          <div className="p-10 text-center text-[13px] text-[#9A9279]">Memuat...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-[15px] font-bold text-[#2B2A24] mb-1">Belum ada data campaign</div>
            <div className="text-[13px] text-[#9A9279]">campaign_snapshots masih kosong untuk brand ini.</div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#FBF6E9]">
                    {['CAMPAIGN', 'ADS SPENT', 'ROAS', 'CPC', 'COST / GOAL', 'STATUS'].map(h => (
                      <th key={h} className="p-[10px_14px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => {
                    const cCpc = c.clicks && c.clicks > 0 && c.spend != null ? c.spend / c.clicks : null
                    const cCpg = c.purchases && c.purchases > 0 && c.spend != null ? c.spend / c.purchases : null
                    return (
                      <tr key={c.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                        <td className="p-[11px_14px] font-semibold text-[#2B2A24]">{c.campaign_name}</td>
                        <td className="p-[11px_14px] text-right text-[#5A574C]">{formatRupiah(c.spend ?? 0, true)}</td>
                        <td className="p-[11px_14px] text-right font-bold" style={{ color: roasColor(c.roas ?? 0) }}>{(c.roas ?? 0).toFixed(2)}</td>
                        <td className="p-[11px_14px] text-right text-[#5A574C]">{cCpc != null ? formatRupiah(cCpc) : '—'}</td>
                        <td className="p-[11px_14px] text-right text-[#5A574C]">{cCpg != null ? formatRupiah(cCpg, true) : '—'}</td>
                        <td className="p-[11px_16px]">
                          <span className="text-[10px] font-semibold rounded-full px-[9px] py-[3px]" style={{
                            background: c.status === 'ACTIVE' ? '#EAF0E5' : '#EEEBE2',
                            color: c.status === 'ACTIVE' ? '#4C6A4A' : '#8A857A',
                          }}>{c.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col divide-y divide-[#F1ECDC]">
              {campaigns.map(c => {
                const cCpg = c.purchases && c.purchases > 0 && c.spend != null ? c.spend / c.purchases : null
                return (
                  <div key={c.id} className="p-[12px_14px]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[13px] font-semibold text-[#2B2A24] truncate">{c.campaign_name}</span>
                      <span className="text-[10px] font-semibold rounded-full px-[9px] py-[3px] flex-shrink-0" style={{
                        background: c.status === 'ACTIVE' ? '#EAF0E5' : '#EEEBE2',
                        color: c.status === 'ACTIVE' ? '#4C6A4A' : '#8A857A',
                      }}>{c.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] text-[#9A9279] mb-[2px]">SPENT</div>
                        <div className="text-[12.5px] font-semibold text-[#2B2A24]">{formatRupiah(c.spend ?? 0, true)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#9A9279] mb-[2px]">ROAS</div>
                        <div className="text-[12.5px] font-bold" style={{ color: roasColor(c.roas ?? 0) }}>{(c.roas ?? 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#9A9279] mb-[2px]">COST/GOAL</div>
                        <div className="text-[12.5px] font-semibold text-[#2B2A24]">{cCpg != null ? formatRupiah(cCpg, true) : '—'}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Report P&L ──────────────────────────────────────────

function PnlRow({ label, value, muted, total, color }: {
  label: string; value: string; muted?: boolean; total?: boolean; color?: string
}) {
  return (
    <div className={`flex items-center justify-between py-[11px] ${total ? 'border-t-2 border-[#E7E0CC] mt-[2px]' : 'border-b border-[#F1ECDC]'}`}>
      <span className={`text-[12.5px] ${total ? 'font-bold' : 'font-medium'}`} style={{ color: muted ? '#9A9279' : '#5A574C' }}>{label}</span>
      <span className={`text-[13px] ${total ? 'font-bold' : 'font-semibold'}`} style={{ color: color ?? '#2B2A24' }}>{value}</span>
    </div>
  )
}

function PnlTab({ brandId, rangeStart, rangeEnd, rangeLabel }: {
  brandId: string | 'all'; rangeStart: string; rangeEnd: string; rangeLabel: string
}) {
  const ordersQ = useScalevOrders(rangeStart, rangeEnd, brandId)
  const spendQ = useMetaAdsDailySpend(rangeStart, rangeEnd, brandId)

  const orders = useMemo(() => ordersQ.data ?? [], [ordersQ.data])
  const spendRows = useMemo(() => spendQ.data ?? [], [spendQ.data])
  const isLoading = ordersQ.isLoading || spendQ.isLoading

  const completed = useMemo(() => orders.filter(o => o.status === 'completed'), [orders])
  // revenueGross = gross_revenue mentah dari Scalev. revenueNet = setelah payment_fee/scalev_fee/
  // service_fee dipotong Scalev (net_payment_revenue) — fallback ke gross kalau baris lama belum
  // punya net_payment_revenue. Profit dihitung dari NET, bukan gross — fee itu beban riil.
  const revenue = completed.reduce((a, o) => a + (o.gross_revenue ?? 0), 0)
  const revenueNet = completed.reduce((a, o) => a + (o.net_payment_revenue ?? o.gross_revenue ?? 0), 0)
  const feeTotal = revenue - revenueNet
  const purchaseValue = spendRows.reduce((a, r) => a + r.purchase_value, 0)
  const spend = spendRows.reduce((a, r) => a + r.spend, 0)
  const netProfit = revenueNet - spend
  const margin = revenueNet > 0 ? (netProfit / revenueNet) * 100 : 0
  const roas = spend > 0 ? purchaseValue / spend : 0
  const profitColor = netProfit >= 0 ? '#4C6A4A' : '#B4452F'

  const chartData = useMemo(() => {
    const revByDate = new Map<string, number>()
    for (const o of completed) revByDate.set(o.order_date, (revByDate.get(o.order_date) ?? 0) + (o.gross_revenue ?? 0))
    const spendByDate = new Map<string, number>()
    for (const r of spendRows) spendByDate.set(r.spend_date, (spendByDate.get(r.spend_date) ?? 0) + r.spend)
    const allDates = Array.from(new Set([...Array.from(revByDate.keys()), ...Array.from(spendByDate.keys())])).sort()
    return allDates.map(d => ({
      date: formatDate(d, 'd MMM'), revenue: revByDate.get(d) ?? 0, spend: spendByDate.get(d) ?? 0,
    }))
  }, [completed, spendRows])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[12px] text-[#9A9279] font-medium mb-2">Purchase Value (Scalev)</div>
          <div className="text-[24px] font-bold text-[#2B2A24] tracking-tight">{formatRupiah(revenue, true)}</div>
          <div className="text-[11.5px] text-[#A89F86] mt-[6px]">Est. Gross Revenue periode</div>
        </div>
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[12px] text-[#9A9279] font-medium mb-2">Ads Spent (Meta)</div>
          <div className="text-[24px] font-bold text-[#C2795A] tracking-tight">− {formatRupiah(spend, true)}</div>
          <div className="text-[11.5px] text-[#A89F86] mt-[6px]">Total biaya iklan</div>
        </div>
        <div className="rounded-lg p-4 text-[#F4EFDF]" style={{ background: netProfit >= 0 ? 'linear-gradient(135deg,#5E7A5C,#4C6A4A)' : 'linear-gradient(135deg,#B4452F,#8F3624)' }}>
          <div className="text-[12px] font-medium mb-2 opacity-80">Profit setelah Ads &amp; Fee</div>
          <div className="text-[24px] font-bold tracking-tight">{formatRupiah(netProfit, true)}</div>
          <div className="text-[12px] mt-[6px] opacity-80">Margin {margin.toFixed(1)}% · ROAS {roas.toFixed(2)} · blm HPP</div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-3 items-start">
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-2">Breakdown P&amp;L</div>
          <div className="flex flex-col">
            <PnlRow label="Est. Gross Revenue" value={formatRupiah(revenue)} />
            <PnlRow label="Fee Scalev &amp; Payment" value={`− ${formatRupiah(feeTotal)}`} color="#C2795A" />
            <PnlRow label="Revenue Bersih (Net)" value={formatRupiah(revenueNet)} />
            <PnlRow label="Ads Spent (Meta)" value={`− ${formatRupiah(spend)}`} color="#C2795A" />
            <PnlRow label="Profit setelah Ads & Fee" value={formatRupiah(netProfit)} total color={profitColor} />
            <PnlRow label="Margin bersih" value={`${margin.toFixed(1)}%`} muted />
            <PnlRow label="ROAS (blended)" value={roas.toFixed(2)} muted />
          </div>
          <div className="text-[10.5px] text-[#A89F86] mt-2">
            Belum termasuk HPP produk — angka di atas adalah revenue bersih (setelah fee Scalev/payment) dikurangi biaya iklan, bukan profit akhir penuh.
          </div>
        </div>

        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-bold text-[#2B2A24]">Revenue vs Spend per Hari</span>
            <div className="flex items-center gap-[12px] text-[11px] text-[#7A766B]">
              <span className="flex items-center gap-[5px]"><span className="w-[9px] h-[9px] rounded-[2px] bg-[#7E997B] inline-block" />Revenue</span>
              <span className="flex items-center gap-[5px]"><span className="w-[11px] h-[3px] rounded-[2px] bg-[#C2795A] inline-block" />Ads Spent</span>
            </div>
          </div>
          <div className="text-[11px] text-[#A89F86] mb-2">{rangeLabel} · total {formatRupiah(revenue, true)}</div>
          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center text-[13px] text-[#9A9279]">Memuat...</div>
          ) : chartData.length < 1 ? (
            <div className="h-[200px] flex items-center justify-center text-[13px] text-[#9A9279]">Belum ada data harian di periode ini</div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F1ECDC" />
                  <XAxis dataKey="date" tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    interval="preserveStartEnd" tickMargin={6} />
                  <YAxis width={42} tick={{ fontSize: 9.5, fill: '#B0A78C' }} axisLine={false} tickLine={false}
                    tickFormatter={compactNumber} tickCount={4} />
                  <Tooltip content={<ChartTooltip formatter={v => formatRupiah(v)} />} cursor={{ fill: '#F1ECDC' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#B7C7B0" radius={[2, 2, 0, 0]} />
                  <Line type="monotone" dataKey="spend" name="Ads Spent" stroke="#C2795A" strokeWidth={2}
                    dot={{ r: 2.5, fill: '#C2795A', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────

export default function PerformancePage() {
  const { brandId, isAllBrands, requireBrandId, rangeStart, rangeEnd, rangeLabel } = useApp()
  const [tab, setTab] = useState<Tab>('omzet')

  const tabBtn = (active: boolean) =>
    `px-[14px] py-[8px] rounded-md text-[12.5px] font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${active ? 'bg-[#5E7A5C] text-white' : 'bg-white text-[#6B6656] border border-[#E3DCC8]'}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button className={tabBtn(tab === 'omzet')} onClick={() => setTab('omzet')}>Omzet &amp; Produk</button>
        <button className={tabBtn(tab === 'iklan')} onClick={() => setTab('iklan')}>Performance Iklan</button>
        <button className={tabBtn(tab === 'pnl')} onClick={() => setTab('pnl')}>Report P&amp;L</button>
      </div>

      {tab === 'omzet' && (
        <OmzetTab brandId={brandId} isAllBrands={isAllBrands} requireBrandId={requireBrandId}
          rangeStart={rangeStart} rangeEnd={rangeEnd} rangeLabel={rangeLabel} />
      )}
      {tab === 'iklan' && (
        <IklanTab brandId={brandId} rangeStart={rangeStart} rangeEnd={rangeEnd} rangeLabel={rangeLabel} />
      )}
      {tab === 'pnl' && (
        <PnlTab brandId={brandId} rangeStart={rangeStart} rangeEnd={rangeEnd} rangeLabel={rangeLabel} />
      )}
    </div>
  )
}

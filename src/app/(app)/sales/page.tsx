'use client'

import { useApp } from '@/contexts/AppContext'
import { canViewFinancial } from '@/lib/financial'
import { useSalesRecords, useProductSold } from '@/lib/queries/sales'
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils'
import { SALES_SOURCE_LABELS } from '@/lib/constants'
import type { SalesSource } from '@/types'

function MetricCard({ label, value, sub }: { label:string; value:string; sub:string }) {
  return (
    <div className="bg-white border border-[#EBE5D4] rounded-lg p-[15px_16px]">
      <div className="text-[12px] text-[#9A9279] mb-2">{label}</div>
      <div className="text-[24px] font-bold text-[#2B2A24] tracking-tight">{value}</div>
      <div className="text-[12px] text-[#A89F86] mt-[6px]">{sub}</div>
    </div>
  )
}

export default function SalesPage() {
  const { userRole, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const canFinancial = canViewFinancial(userRole)

  const salesQ   = useSalesRecords(rangeStart, rangeEnd)
  const soldQ    = useProductSold(rangeStart, rangeEnd)

  if (authLoading) return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>

  const sales = salesQ.data ?? []
  const sold  = soldQ.data ?? []

  const totalGross  = sales.reduce((a, b) => a + b.gross_revenue, 0)
  const totalOrders = sales.reduce((a, b) => a + b.order_count, 0)
  const totalUnits  = canFinancial ? sales.reduce((a,b) => a+b.quantity,0) : sold.reduce((a,b) => a+b.quantity,0)
  const aov = totalOrders > 0 ? totalGross / totalOrders : 0

  const teamOrders = sold.reduce((a, b) => a + b.order_count, 0)
  const teamUnits  = sold.reduce((a, b) => a + b.quantity, 0)

  const byProduct: Record<string, number> = {}
  ;(canFinancial ? sales : sold).forEach(r => {
    byProduct[r.product_name] = (byProduct[r.product_name] ?? 0) + r.quantity
  })
  const prodEntries = Object.entries(byProduct).sort((a, b) => b[1] - a[1])
  const prodMax = Math.max(...prodEntries.map(e => e[1]), 1)

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="grid grid-cols-4 gap-[14px]">
        {canFinancial ? (
          <>
            <MetricCard label="Omzet (Gross)"  value={formatRupiah(totalGross, true)}  sub="total gross revenue"/>
            <MetricCard label="Total Order"    value={formatNumber(totalOrders)}        sub="order"/>
            <MetricCard label="AOV"            value={formatRupiah(aov, true)}          sub="rata-rata / order"/>
            <MetricCard label="Produk Terjual" value={formatNumber(totalUnits)}         sub="unit"/>
          </>
        ) : (
          <>
            <MetricCard label="Produk Terjual" value={formatNumber(teamUnits)}  sub="unit terjual"/>
            <MetricCard label="Total Order"    value={formatNumber(teamOrders)} sub="total order"/>
            <MetricCard label="Produk Terlaris" value={prodEntries[0]?.[0]?.split(' ').slice(0,2).join(' ') ?? '-'} sub={`${prodEntries[0]?.[1] ?? 0} unit`}/>
            <MetricCard label="Channel Utama"  value="—" sub="belum ada data"/>
          </>
        )}
      </div>

      {/* Product bar chart */}
      {prodEntries.length > 0 && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg p-4">
          <div className="text-[13px] font-bold text-[#2B2A24] mb-[14px]">Unit Terjual / Produk</div>
          <div className="flex flex-col gap-[13px]">
            {prodEntries.map(([name, val]) => (
              <div key={name}>
                <div className="flex justify-between text-[12px] mb-[5px]">
                  <span className="text-[#5A574C] font-medium truncate max-w-[300px]">{name}</span>
                  <span className="font-bold text-[#2B2A24]">{formatNumber(val)}</span>
                </div>
                <div className="h-[18px] bg-[#F0EBDA] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${(val/prodMax)*100}%`, background:'linear-gradient(90deg,#7E997B,#9DB59A)'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales table */}
      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        <div className="px-4 py-[14px] text-[13px] font-bold text-[#2B2A24] border-b border-[#F1ECDC]">Riwayat Penjualan</div>
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#FBF6E9]">
              <th className="p-[10px_14px] text-left text-[10px] font-semibold text-[#9A9279]">TANGGAL</th>
              <th className="p-[10px_14px] text-left text-[10px] font-semibold text-[#9A9279]">PRODUK</th>
              <th className="p-[10px_14px] text-center text-[10px] font-semibold text-[#9A9279]">ORDER</th>
              <th className="p-[10px_14px] text-center text-[10px] font-semibold text-[#9A9279]">QTY</th>
              {canFinancial && <>
                <th className="p-[10px_14px] text-right text-[10px] font-semibold text-[#9A9279]">GROSS</th>
                <th className="p-[10px_14px] text-right text-[10px] font-semibold text-[#9A9279]">NET</th>
              </>}
              <th className="p-[10px_14px] text-left text-[10px] font-semibold text-[#9A9279]">{canFinancial ? 'SOURCE' : 'CHANNEL'}</th>
            </tr>
          </thead>
          <tbody>
            {(canFinancial ? sales : sold).length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-[13px] text-[#A89F86]">Belum ada data penjualan.</td></tr>
            )}
            {canFinancial
              ? sales.map(r => (
                <tr key={r.id} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                  <td className="p-[11px_14px] text-[#7A766B]">{formatDate(r.sales_date, 'd MMM')}</td>
                  <td className="p-[11px_14px] font-semibold text-[#2B2A24]">{r.product_name}</td>
                  <td className="p-[11px_14px] text-center text-[#5A574C]">{r.order_count}</td>
                  <td className="p-[11px_14px] text-center text-[#5A574C]">{r.quantity}</td>
                  <td className="p-[11px_14px] text-right text-[#5A574C]">{formatRupiah(r.gross_revenue)}</td>
                  <td className="p-[11px_14px] text-right font-semibold text-[#2B2A24]">{formatRupiah(r.net_revenue)}</td>
                  <td className="p-[11px_14px]">
                    <span className="text-[11px] text-[#5A574C] bg-[#F0EBDA] rounded-full px-[9px] py-[2px]">
                      {SALES_SOURCE_LABELS[r.source as SalesSource] ?? r.source}
                    </span>
                  </td>
                </tr>
              ))
              : sold.map((r, i) => (
                <tr key={i} className="border-t border-[#F1ECDC] hover:bg-[#FDFAF3]">
                  <td className="p-[11px_14px] text-[#7A766B]">{formatDate(r.sales_date, 'd MMM')}</td>
                  <td className="p-[11px_14px] font-semibold text-[#2B2A24]">{r.product_name}</td>
                  <td className="p-[11px_14px] text-center text-[#5A574C]">{r.order_count}</td>
                  <td className="p-[11px_14px] text-center text-[#5A574C]">{r.quantity}</td>
                  <td className="p-[11px_14px]">
                    <span className="text-[11px] text-[#5A574C] bg-[#F0EBDA] rounded-full px-[9px] py-[2px]">{r.channel ?? '—'}</span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

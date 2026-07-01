'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useKpis, useAllKpiResults, useCreateKpi, useUpdateKpi, useDeleteKpi, useUpsertKpiResult } from '@/lib/queries/kpi'
import { useAllUsers } from '@/lib/queries/daily-reports'
import { getInitials, formatNumber } from '@/lib/utils'
import type { KpiPeriod, KpiCalculationMethod } from '@/types'

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}
function barColor(pct: number) {
  if (pct >= 100) return '#5E8C61'
  if (pct >= 80) return '#C9A227'
  return '#C77B3C'
}

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

const PERIODS: KpiPeriod[] = ['daily','weekly','monthly','custom']
const METHODS: KpiCalculationMethod[] = ['manual','task','content','sales','instagram']
const PERIOD_LABEL: Record<string, string> = { daily:'Harian', weekly:'Mingguan', monthly:'Bulanan', custom:'Custom' }
const METHOD_LABEL: Record<string, string> = { manual:'Manual', task:'Task', content:'Konten', sales:'Penjualan', instagram:'Instagram' }
const CATEGORIES = ['Produktivitas','Konten','Sales','Engagement','Reach','Lainnya']

export default function KpiPage() {
  const { userId, isLeader, rangeStart, rangeEnd, isLoading: authLoading } = useApp()
  const allQ      = useAllKpiResults(rangeStart, rangeEnd)
  const kpisQ     = useKpis()
  const usersQ    = useAllUsers()
  const createKpi  = useCreateKpi()
  const updateKpi  = useUpdateKpi()
  const deleteKpi  = useDeleteKpi()
  const upsertResult = useUpsertKpiResult()

  const [showCreateKpi, setShowCreateKpi] = useState(false)
  const [showInputResult, setShowInputResult] = useState(false)
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null)
  const [tab, setTab] = useState<'results' | 'definitions'>('results')

  const [kpiForm, setKpiForm] = useState({
    name: '', description: '', category: 'Produktivitas',
    target_value: '', unit: '', weight: '10',
    period: 'monthly' as KpiPeriod, calculation_method: 'manual' as KpiCalculationMethod,
    user_id: '',
  })
  const [kpiErr, setKpiErr] = useState('')

  const [resultForm, setResultForm] = useState({
    kpi_id: '', user_id: '', actual_value: '', notes: '',
  })
  const [resultErr, setResultErr] = useState('')

  async function handleCreateKpi() {
    setKpiErr('')
    if (!kpiForm.name || !kpiForm.target_value || !kpiForm.unit) {
      setKpiErr('Nama, target, dan unit wajib diisi.'); return
    }
    try {
      await createKpi.mutateAsync({
        name: kpiForm.name,
        description: kpiForm.description || undefined,
        category: kpiForm.category,
        target_value: parseFloat(kpiForm.target_value),
        unit: kpiForm.unit,
        weight: parseFloat(kpiForm.weight) || 10,
        period: kpiForm.period,
        calculation_method: kpiForm.calculation_method,
        ...(kpiForm.user_id && { user_id: kpiForm.user_id }),
      })
      setShowCreateKpi(false)
      setKpiForm({ name: '', description: '', category: 'Produktivitas', target_value: '', unit: '', weight: '10', period: 'monthly', calculation_method: 'manual', user_id: '' })
    } catch (e) { setKpiErr((e as Error).message) }
  }

  function openEditKpi(kpi: typeof kpis[0]) {
    setKpiForm({
      name: kpi.name,
      description: kpi.description ?? '',
      category: kpi.category,
      target_value: String(kpi.target_value),
      unit: kpi.unit,
      weight: String(kpi.weight),
      period: kpi.period,
      calculation_method: kpi.calculation_method,
      user_id: kpi.user_id ?? '',
    })
    setKpiErr('')
    setEditingKpiId(kpi.id)
    setShowCreateKpi(true)
  }

  async function handleUpdateKpi() {
    setKpiErr('')
    if (!kpiForm.name || !kpiForm.target_value || !kpiForm.unit) {
      setKpiErr('Nama, target, dan unit wajib diisi.'); return
    }
    if (!editingKpiId) return
    try {
      await updateKpi.mutateAsync({
        id: editingKpiId,
        name: kpiForm.name,
        description: kpiForm.description || undefined,
        category: kpiForm.category,
        target_value: parseFloat(kpiForm.target_value),
        unit: kpiForm.unit,
        weight: parseFloat(kpiForm.weight) || 10,
        period: kpiForm.period,
        calculation_method: kpiForm.calculation_method,
        ...(kpiForm.user_id && { user_id: kpiForm.user_id }),
      })
      setShowCreateKpi(false)
      setEditingKpiId(null)
      setKpiForm({ name: '', description: '', category: 'Produktivitas', target_value: '', unit: '', weight: '10', period: 'monthly', calculation_method: 'manual', user_id: '' })
    } catch (e) { setKpiErr((e as Error).message) }
  }

  async function handleInputResult() {
    setResultErr('')
    if (!resultForm.kpi_id || !resultForm.user_id || !resultForm.actual_value) {
      setResultErr('KPI, user, dan nilai aktual wajib diisi.'); return
    }
    const kpi = (kpisQ.data ?? []).find(k => k.id === resultForm.kpi_id)
    if (!kpi) { setResultErr('KPI tidak ditemukan.'); return }
    const actual = parseFloat(resultForm.actual_value)
    const pct = (actual / kpi.target_value) * 100
    try {
      await upsertResult.mutateAsync({
        kpi_id: resultForm.kpi_id,
        user_id: resultForm.user_id,
        period_start: rangeStart,
        period_end: rangeEnd,
        target_value: kpi.target_value,
        actual_value: actual,
        achievement_percentage: pct,
        weighted_score: Math.min(100, pct) * (kpi.weight / 100),
        input_type: 'manual',
        notes: resultForm.notes || undefined,
      })
      setShowInputResult(false)
      setResultForm({ kpi_id: '', user_id: '', actual_value: '', notes: '' })
    } catch (e) { setResultErr((e as Error).message) }
  }

  if (authLoading || allQ.isLoading) {
    return <div className="animate-pulse h-64 bg-[#F0EBDA] rounded-lg"/>
  }

  const rows = isLeader ? (allQ.data ?? []) : (allQ.data ?? []).filter(r => r.user_id === userId)
  const kpis = kpisQ.data ?? []
  const users = usersQ.data ?? []

  const segBtn = (active: boolean) =>
    `px-[14px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${active ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'}`

  return (
    <div className="flex flex-col gap-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px]">
          <button className={segBtn(tab === 'results')} onClick={() => setTab('results')}>Hasil KPI</button>
          {isLeader && <button className={segBtn(tab === 'definitions')} onClick={() => setTab('definitions')}>Definisi KPI</button>}
        </div>
        {isLeader && (
          <div className="flex gap-2">
            <button onClick={() => setShowInputResult(true)}
              className="bg-[#EFEAD9] text-[#5A574C] border-none rounded-md px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer hover:bg-[#E3DCC8]">
              + Input Nilai
            </button>
            <button onClick={() => setShowCreateKpi(true)}
              className="bg-[#5E7A5C] text-white border-none rounded-md px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer hover:bg-[#4F6A4D]">
              + Buat KPI
            </button>
          </div>
        )}
      </div>

      {/* Results tab */}
      {tab === 'results' && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#A89F86]">
              Belum ada data KPI untuk periode ini.{isLeader && ' Klik "+ Input Nilai" untuk memasukkan hasil.'}
            </div>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FBF6E9]">
                  {['KPI','USER','TARGET','AKTUAL','ACHIEVEMENT'].map((h, i) => (
                    <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]"
                      style={i === 4 ? { width: 200 } : {}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((k, idx) => {
                  const pct = Math.round(k.achievement_percentage)
                  const cap = Math.min(100, pct)
                  const bc  = barColor(pct)
                  const user = users.find(u => u.id === k.user_id)
                  const name = user?.name ?? k.user_id.slice(0, 8)
                  return (
                    <tr key={`${k.kpi_id}-${k.user_id}-${idx}`}
                      className="border-t border-[#F1ECDC] hover:bg-[#FBF6E9] cursor-pointer group"
                      onClick={() => {
                        setResultForm({ kpi_id: k.kpi_id, user_id: k.user_id, actual_value: String(k.actual_value), notes: '' })
                        setShowInputResult(true)
                      }}>
                      <td className="p-[12px_16px] font-semibold text-[#2B2A24]">{k.kpi_name}</td>
                      <td className="p-[12px_16px]">
                        <div className="flex items-center gap-[7px]">
                          <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[9px] font-semibold text-white"
                            style={{ background: avatarColor(name) }}>
                            {getInitials(name)}
                          </div>
                          <span className="text-[#5A574C] text-[12px]">{name}</span>
                        </div>
                      </td>
                      <td className="p-[12px_16px] text-[#7A766B]">{formatNumber(k.target_value)}</td>
                      <td className="p-[12px_16px] font-semibold text-[#2B2A24]">{formatNumber(k.actual_value)}</td>
                      <td className="p-[12px_16px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="flex-1 h-[7px] bg-[#EDE7D6] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-[width_.4s]" style={{ width: `${cap}%`, background: bc }}/>
                          </div>
                          <span className="text-[12px] font-bold w-[38px] text-right" style={{ color: bc }}>{pct}%</span>
                          <span className="text-[10px] text-[#4F7CAC] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Definitions tab */}
      {tab === 'definitions' && isLeader && (
        <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
          {kpis.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#A89F86]">Belum ada KPI. Klik "+ Buat KPI".</div>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FBF6E9]">
                  {['NAMA KPI','KATEGORI','TARGET','UNIT','BOBOT','PERIODE',''].map(h => (
                    <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.map(k => (
                  <tr key={k.id}
                    className="border-t border-[#F1ECDC] hover:bg-[#FBF6E9] cursor-pointer group"
                    onClick={() => openEditKpi(k)}>
                    <td className="p-[11px_16px] font-semibold text-[#2B2A24]">{k.name}</td>
                    <td className="p-[11px_16px] text-[#5A574C]">{k.category}</td>
                    <td className="p-[11px_16px] text-[#5A574C]">{formatNumber(k.target_value)}</td>
                    <td className="p-[11px_16px] text-[#5A574C]">{k.unit}</td>
                    <td className="p-[11px_16px] font-semibold text-[#2B2A24]">{k.weight}%</td>
                    <td className="p-[11px_16px]">
                      <span className="text-[11px] bg-[#EFEAD9] text-[#5A574C] rounded-full px-[9px] py-[3px] font-semibold">
                        {PERIOD_LABEL[k.period] ?? k.period}
                      </span>
                    </td>
                    <td className="p-[11px_16px]" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus KPI "${k.name}"? Data hasil KPI tidak akan terhapus.`)) {
                            deleteKpi.mutate(k.id)
                          }
                        }}
                        className="text-[11px] text-[#B4452F] hover:underline border-none bg-none cursor-pointer font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create KPI Modal */}
      {showCreateKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCreateKpi(false); setEditingKpiId(null) }}/>
          <div className="relative bg-white rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#2B2A24]">{editingKpiId ? 'Edit KPI' : 'Buat KPI Baru'}</h3>
              <button onClick={() => { setShowCreateKpi(false); setEditingKpiId(null) }} className="text-[#9A9279] text-xl border-none bg-none cursor-pointer">×</button>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Nama KPI *</label>
              <input className={inputCls} placeholder="Nama KPI..." value={kpiForm.name}
                onChange={e => setKpiForm(f => ({ ...f, name: e.target.value }))}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Kategori</label>
                <select className={inputCls} value={kpiForm.category}
                  onChange={e => setKpiForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Metode Hitung</label>
                <select className={inputCls} value={kpiForm.calculation_method}
                  onChange={e => setKpiForm(f => ({ ...f, calculation_method: e.target.value as KpiCalculationMethod }))}>
                  {METHODS.map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Target *</label>
                <input className={inputCls} type="number" placeholder="10"
                  value={kpiForm.target_value} onChange={e => setKpiForm(f => ({ ...f, target_value: e.target.value }))}/>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Unit *</label>
                <input className={inputCls} placeholder="konten, %" value={kpiForm.unit}
                  onChange={e => setKpiForm(f => ({ ...f, unit: e.target.value }))}/>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Bobot (%)</label>
                <input className={inputCls} type="number" min="0" max="100" placeholder="10"
                  value={kpiForm.weight} onChange={e => setKpiForm(f => ({ ...f, weight: e.target.value }))}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Periode</label>
                <select className={inputCls} value={kpiForm.period}
                  onChange={e => setKpiForm(f => ({ ...f, period: e.target.value as KpiPeriod }))}>
                  {PERIODS.map(p => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12px] font-semibold text-[#5A574C]">Assign ke User</label>
                <select className={inputCls} value={kpiForm.user_id}
                  onChange={e => setKpiForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Semua Tim</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            {kpiErr && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-2">{kpiErr}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setShowCreateKpi(false); setEditingKpiId(null) }}
                className="flex-1 bg-[#EFEAD9] text-[#5A574C] border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer">Batal</button>
              <button
                onClick={editingKpiId ? handleUpdateKpi : handleCreateKpi}
                disabled={createKpi.isPending || updateKpi.isPending}
                className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                {(createKpi.isPending || updateKpi.isPending) ? 'Menyimpan...' : editingKpiId ? 'Simpan Perubahan' : 'Buat KPI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input KPI Result Modal */}
      {showInputResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowInputResult(false)}/>
          <div className="relative bg-white rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#2B2A24]">
                {resultForm.kpi_id && resultForm.actual_value ? 'Edit Nilai KPI' : 'Input Nilai KPI'}
              </h3>
              <button onClick={() => setShowInputResult(false)} className="text-[#9A9279] text-xl border-none bg-none cursor-pointer">×</button>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">KPI *</label>
              <select className={inputCls} value={resultForm.kpi_id}
                onChange={e => setResultForm(f => ({ ...f, kpi_id: e.target.value }))}>
                <option value="">Pilih KPI...</option>
                {kpis.map(k => <option key={k.id} value={k.id}>{k.name} (target: {k.target_value} {k.unit})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">User *</label>
              <select className={inputCls} value={resultForm.user_id}
                onChange={e => setResultForm(f => ({ ...f, user_id: e.target.value }))}>
                <option value="">Pilih user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Nilai Aktual *</label>
              <input className={inputCls} type="number" placeholder="Nilai aktual..."
                value={resultForm.actual_value} onChange={e => setResultForm(f => ({ ...f, actual_value: e.target.value }))}/>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[12px] font-semibold text-[#5A574C]">Catatan</label>
              <input className={inputCls} placeholder="Opsional..." value={resultForm.notes}
                onChange={e => setResultForm(f => ({ ...f, notes: e.target.value }))}/>
            </div>
            {resultErr && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-2">{resultErr}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowInputResult(false)}
                className="flex-1 bg-[#EFEAD9] text-[#5A574C] border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer">Batal</button>
              <button onClick={handleInputResult} disabled={upsertResult.isPending}
                className="flex-1 bg-[#5E7A5C] text-white border-none rounded-md py-[9px] text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                {upsertResult.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

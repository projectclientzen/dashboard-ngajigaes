'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useProducts } from '@/lib/queries/sales'
import {
  useTeamUsers, useRoles, useCreateUser, useDeactivateUser,
  useCreateProduct, useUpdateProduct, useScoreSettingsData, useUpdateScoreSettings,
} from '@/lib/queries/settings'
import { formatRupiah } from '@/lib/utils'
import type { Role, ProductType } from '@/types'

const ROLE_LABEL: Record<string, string> = {
  leader: 'Leader',
  feed_socmed: 'Feed & Sosmed',
  reels_ads: 'Reels & Ads',
  curator: 'Kurator',
}

const ROLE_COLOR: Record<string, { c: string; bg: string }> = {
  leader:     { c: '#5E7A5C', bg: '#E9F1E6' },
  feed_socmed:{ c: '#4F7CAC', bg: '#E8F0F6' },
  reels_ads:  { c: '#8A6BA8', bg: '#F0EAF7' },
  curator:    { c: '#C77B3C', bg: '#F8EEE2' },
}

const PRODUCT_TYPE_LABEL: Record<string, string> = {
  ebook: 'E-book', bundle: 'Bundle', ecourse: 'E-Course',
  audiobook: 'Audiobook', other: 'Lainnya',
}

const AVATAR_COLORS = ['#5E7A5C','#4F7CAC','#C2795A','#8A6BA8','#3F8C8C','#B07A3C']
function avatarColor(name: string) {
  return AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
}
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[15px] font-bold text-[#2B2A24]">{title}</h2>
      {action}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', disabled, small }: {
  children: React.ReactNode; onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; small?: boolean
}) {
  const base = 'border-none rounded-md font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sz = small ? 'px-[12px] py-[7px] text-[12px]' : 'px-[16px] py-[9px] text-[13px]'
  const v = {
    primary: 'bg-[#5E7A5C] text-white hover:bg-[#4F6A4D]',
    ghost:   'bg-[#EFEAD9] text-[#5A574C] hover:bg-[#E3DCC8]',
    danger:  'bg-[#F7E7E2] text-[#B4452F] hover:bg-[#F0D5CE]',
  }
  return <button className={`${base} ${sz} ${v[variant]}`} onClick={onClick} disabled={disabled}>{children}</button>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="relative bg-white rounded-xl border border-[#EBE5D4] shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#2B2A24]">{title}</h3>
          <button onClick={onClose} className="text-[#9A9279] text-xl border-none bg-none cursor-pointer leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[12px] font-semibold text-[#5A574C]">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border border-[#E3DCC8] rounded-md px-3 py-[9px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors w-full'

// ─── USERS TAB ────────────────────────────────────────────────
function UsersTab() {
  const usersQ = useTeamUsers()
  const rolesQ = useRoles()
  const createUser = useCreateUser()
  const deactivate = useDeactivateUser()
  const { userId } = useApp()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' })
  const [err, setErr] = useState('')

  const roles = rolesQ.data ?? []
  const users = usersQ.data ?? []

  async function handleInvite() {
    setErr('')
    if (!form.name || !form.email || !form.password || !form.role_id) {
      setErr('Semua field wajib diisi.'); return
    }
    try {
      await createUser.mutateAsync(form)
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role_id: '' })
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div>
      <SectionHeader
        title={`Anggota Tim (${users.length})`}
        action={<Btn onClick={() => setShowModal(true)}>+ Undang Anggota</Btn>}
      />
      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        {usersQ.isLoading ? (
          <div className="p-6 text-[13px] text-[#9A9279]">Memuat...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#9A9279]">Belum ada anggota.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#FBF6E9]">
                {['ANGGOTA', 'EMAIL', 'ROLE', 'STATUS', ''].map(h => (
                  <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const rc = ROLE_COLOR[u.role] ?? ROLE_COLOR.feed_socmed
                const isMe = u.id === userId
                return (
                  <tr key={u.id} className="border-t border-[#F1ECDC]">
                    <td className="p-[11px_16px]">
                      <div className="flex items-center gap-[10px]">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{ background: avatarColor(u.name) }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2B2A24]">{u.name}{isMe && <span className="ml-1 text-[10px] text-[#9A9279]">(kamu)</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-[11px_16px] text-[#5A574C]">{u.email}</td>
                    <td className="p-[11px_16px]">
                      <span className="text-[11px] font-semibold px-[9px] py-[3px] rounded-full"
                        style={{ color: rc.c, background: rc.bg }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="p-[11px_16px]">
                      <span className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full ${u.status === 'active' ? 'text-[#5E8C61] bg-[#E9F3EA]' : 'text-[#9A9279] bg-[#EFEAD9]'}`}>
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-[11px_16px]">
                      {!isMe && u.status === 'active' && (
                        <button
                          onClick={() => { if (confirm(`Nonaktifkan ${u.name}?`)) deactivate.mutate(u.id) }}
                          className="text-[11px] text-[#B4452F] border-none bg-none cursor-pointer hover:underline">
                          Nonaktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Undang Anggota Tim" onClose={() => setShowModal(false)}>
          <Field label="Nama Lengkap">
            <input className={inputCls} placeholder="Nama anggota"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" placeholder="email@contoh.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
          </Field>
          <Field label="Password Sementara">
            <input className={inputCls} type="password" placeholder="Min. 6 karakter"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}/>
          </Field>
          <Field label="Role">
            <select className={inputCls} value={form.role_id}
              onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
              <option value="">Pilih role...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{ROLE_LABEL[r.name] ?? r.name}</option>
              ))}
            </select>
          </Field>
          {err && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-[8px]">{err}</div>}
          <div className="flex gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
            <Btn onClick={handleInvite} disabled={createUser.isPending}>
              {createUser.isPending ? 'Menyimpan...' : 'Undang'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────
function ProductsTab() {
  const productsQ = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', type: 'ebook' as ProductType, price: '', status: 'active' as 'active' | 'inactive' })
  const [err, setErr] = useState('')

  const products = productsQ.data ?? []

  function openNew() {
    setEditing(null)
    setForm({ name: '', type: 'ebook', price: '', status: 'active' })
    setErr('')
    setShowModal(true)
  }

  function openEdit(p: typeof products[0]) {
    setEditing(p.id)
    setForm({ name: p.name, type: p.type, price: String(p.price), status: p.status })
    setErr('')
    setShowModal(true)
  }

  async function handleSave() {
    setErr('')
    if (!form.name || !form.price) { setErr('Nama dan harga wajib diisi.'); return }
    const price = parseInt(form.price.replace(/\D/g, ''), 10)
    if (isNaN(price)) { setErr('Harga harus angka.'); return }
    try {
      if (editing) {
        await updateProduct.mutateAsync({ id: editing, name: form.name, type: form.type, price, status: form.status })
      } else {
        await createProduct.mutateAsync({ name: form.name, type: form.type, price, status: form.status })
      }
      setShowModal(false)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div>
      <SectionHeader
        title={`Produk (${products.length})`}
        action={<Btn onClick={openNew}>+ Tambah Produk</Btn>}
      />
      <div className="bg-white border border-[#EBE5D4] rounded-lg overflow-hidden">
        {productsQ.isLoading ? (
          <div className="p-6 text-[13px] text-[#9A9279]">Memuat...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#9A9279]">Belum ada produk.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#FBF6E9]">
                {['NAMA PRODUK', 'TIPE', 'HARGA', 'STATUS', ''].map(h => (
                  <th key={h} className="p-[11px_16px] text-left text-[10px] font-semibold tracking-[.05em] text-[#9A9279]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-[#F1ECDC]">
                  <td className="p-[11px_16px] font-semibold text-[#2B2A24]">{p.name}</td>
                  <td className="p-[11px_16px] text-[#5A574C]">{PRODUCT_TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="p-[11px_16px] font-semibold text-[#2B2A24]">{formatRupiah(p.price)}</td>
                  <td className="p-[11px_16px]">
                    <span className={`text-[11px] font-semibold px-[9px] py-[3px] rounded-full ${p.status === 'active' ? 'text-[#5E8C61] bg-[#E9F3EA]' : 'text-[#9A9279] bg-[#EFEAD9]'}`}>
                      {p.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-[11px_16px]">
                    <button onClick={() => openEdit(p)}
                      className="text-[11px] text-[#4F7CAC] border-none bg-none cursor-pointer hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Produk' : 'Tambah Produk'} onClose={() => setShowModal(false)}>
          <Field label="Nama Produk">
            <input className={inputCls} placeholder="Nama produk"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </Field>
          <Field label="Tipe">
            <select className={inputCls} value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as ProductType }))}>
              {Object.entries(PRODUCT_TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Harga (Rp)">
            <input className={inputCls} placeholder="150000"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}/>
          </Field>
          {editing && (
            <Field label="Status">
              <select className={inputCls} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </Field>
          )}
          {err && <div className="text-[12px] text-[#B4452F] bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-[8px]">{err}</div>}
          <div className="flex gap-2 pt-1">
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Batal</Btn>
            <Btn onClick={handleSave} disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? 'Menyimpan...' : 'Simpan'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SCORE SETTINGS TAB ───────────────────────────────────────
function ScoreTab() {
  const settingsQ = useScoreSettingsData()
  const update = useUpdateScoreSettings()
  const [form, setForm] = useState<Record<string, number> | null>(null)
  const [saved, setSaved] = useState(false)

  const data = settingsQ.data
  const weights = form ?? (data ? {
    task_weight: data.task_weight,
    deadline_weight: data.deadline_weight,
    kpi_weight: data.kpi_weight,
    quality_weight: data.quality_weight,
    initiative_weight: data.initiative_weight,
  } : null)

  const total = weights ? Object.values(weights).reduce((a, v) => a + v, 0) : 0
  const totalOk = Math.abs(total - 1) < 0.001

  const LABELS: Record<string, string> = {
    task_weight: 'Penyelesaian Task',
    deadline_weight: 'Ketepatan Deadline',
    kpi_weight: 'Pencapaian KPI',
    quality_weight: 'Kualitas Kerja',
    initiative_weight: 'Inisiatif',
  }

  async function handleSave() {
    if (!data || !weights || !totalOk) return
    await update.mutateAsync({ id: data.id, ...weights } as typeof data & typeof weights)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (settingsQ.isLoading) return <div className="text-[13px] text-[#9A9279]">Memuat...</div>
  if (!weights) return null

  return (
    <div>
      <SectionHeader title="Bobot Skor Produktivitas"/>
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-5 flex flex-col gap-4">
        <p className="text-[12px] text-[#9A9279]">Total bobot harus = 1.00. Perubahan berlaku untuk perhitungan skor berikutnya.</p>
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-4">
            <span className="text-[13px] text-[#3F3D34] w-[180px] flex-shrink-0">{label}</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={weights[key]}
              onChange={e => {
                setForm(f => ({ ...(f ?? weights), [key]: parseFloat(e.target.value) }))
                setSaved(false)
              }}
              className="flex-1 accent-[#5E7A5C]"
            />
            <span className="text-[13px] font-semibold text-[#2B2A24] w-[42px] text-right">
              {(weights[key] * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        <div className={`text-[12px] font-semibold px-3 py-2 rounded-md ${totalOk ? 'bg-[#E9F1E6] text-[#5E8C61]' : 'bg-[#F7E7E2] text-[#B4452F]'}`}>
          Total: {(total * 100).toFixed(0)}% {totalOk ? '✓ Seimbang' : '— Harus tepat 100%'}
        </div>
        <div className="flex items-center gap-3">
          <Btn onClick={handleSave} disabled={!totalOk || update.isPending}>
            {update.isPending ? 'Menyimpan...' : 'Simpan Bobot'}
          </Btn>
          {saved && <span className="text-[12px] text-[#5E8C61] font-semibold">✓ Tersimpan</span>}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────
type Tab = 'users' | 'products' | 'score'
const TABS: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Anggota Tim' },
  { id: 'products', label: 'Produk' },
  { id: 'score', label: 'Bobot Skor' },
]

export default function SettingsPage() {
  const { isLeader, isLoading } = useApp()
  const [tab, setTab] = useState<Tab>('users')

  if (isLoading) {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex items-center justify-center">
        <div className="text-[13px] text-[#9A9279]">Memuat...</div>
      </div>
    )
  }

  if (!isLeader) {
    return (
      <div className="bg-white border border-[#EBE5D4] rounded-lg p-10 flex flex-col items-center text-center gap-3">
        <div className="text-[16px] font-bold text-[#2B2A24]">Akses Terbatas</div>
        <div className="text-[13px] text-[#9A9279]">Halaman ini hanya untuk Leader.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="inline-flex bg-[#EFEAD9] rounded-lg p-[3px] gap-[2px] self-start">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-[14px] py-[6px] rounded-md text-[12px] font-semibold cursor-pointer border-none transition-all ${
              tab === t.id ? 'bg-white text-[#3F5A3E] shadow-sm' : 'bg-transparent text-[#8A8675]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users'    && <UsersTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'score'    && <ScoreTab />}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError('Email atau password salah. Coba lagi.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F4EFDF] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-[10px] bg-[#7E997B] flex items-center justify-center text-[#FCF8EC] font-['Bitter'] font-bold text-xl">
            N
          </div>
          <div className="font-['Bitter'] font-bold text-2xl text-[#5E7A5C] tracking-tight">
            NgajiGaes<span className="text-[#C2795A]">.</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#EBE5D4] p-7 shadow-sm">
          <h1 className="text-[18px] font-bold text-[#2B2A24] mb-1">Masuk ke Dashboard</h1>
          <p className="text-[13px] text-[#9A9279] mb-6">Gunakan akun yang diberikan leader.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#5A574C] block mb-[6px]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@ngajigaes.id"
                required
                className="w-full border border-[#E3DCC8] rounded-md px-3 py-[10px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#5A574C] block mb-[6px]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-[#E3DCC8] rounded-md px-3 py-[10px] text-[13px] bg-[#FCFAF2] text-[#2B2A24] focus:outline-none focus:border-[#7E997B] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[#F7E7E2] border border-[#EAC8BF] rounded-md px-3 py-[10px] text-[12px] text-[#B4452F] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#5E7A5C] text-white border-none rounded-md py-[11px] text-[14px] font-semibold cursor-pointer hover:bg-[#4F6A4D] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#B0A78C] mt-4">
          Belum punya akun? Minta ke Leader untuk membuat akun.
        </p>
      </div>
    </div>
  )
}

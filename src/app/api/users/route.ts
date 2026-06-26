import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/users
 * Buat user baru. Hanya Leader yang boleh.
 * Body: { name, email, password, role_id }
 */
export async function POST(request: NextRequest) {
  try {
    // Verifikasi caller adalah Leader
    const supabase = createClient()
    const { data: { user: caller } } = await supabase.auth.getUser()
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cek role — pakai cast any karena strict typing Supabase join bisa bermasalah
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    const { data: profileData } = await sb
      .from('users').select('role_id').eq('id', caller.id).single()

    if (!profileData) {
      return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })
    }

    const { data: roleData } = await sb
      .from('roles').select('name').eq('id', profileData.role_id).single()

    if (roleData?.name !== 'leader') {
      return NextResponse.json({ error: 'Hanya leader yang boleh membuat user' }, { status: 403 })
    }

    // Parse body
    const body = await request.json()
    const { name, email, password, role_id } = body as {
      name: string; email: string; password: string; role_id: string
    }

    if (!name || !email || !password || !role_id) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Buat auth user via Admin API
    const admin = createAdminClient()
    const { data: newAuthUser, error: authError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })

    if (authError || !newAuthUser.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Gagal membuat akun auth' },
        { status: 400 }
      )
    }

    // Insert profil — pakai any karena admin client DB types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = admin as any
    const { error: profileError } = await adminDb.from('users').insert({
      id: newAuthUser.user.id,
      name, email, role_id,
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: { id: newAuthUser.user.id, name, email, role_id },
    })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

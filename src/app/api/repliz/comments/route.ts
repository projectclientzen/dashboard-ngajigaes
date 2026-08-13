import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getComments, replyComment, updateCommentStatus, type CommentStatus } from '@/lib/server/repliz'

async function requireUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET — list komentar (?page=&status=&limit=)
export async function GET(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? '1') || 1
  const limit = Number(searchParams.get('limit') ?? '20') || 20
  const status = (searchParams.get('status') ?? undefined) as CommentStatus | undefined

  try {
    const result = await getComments(page, status, limit)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}

// POST — balas komentar. Body: { comment_id: string, text: string }
// Setelah balas sukses, komentar otomatis ditandai 'resolved' (endpoint
// reply Repliz tidak mengubah status sendiri — perlu panggilan terpisah).
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { comment_id?: string; text?: string }
  if (!body.comment_id || !body.text?.trim()) {
    return NextResponse.json({ error: 'comment_id dan text wajib diisi' }, { status: 400 })
  }

  try {
    const reply = await replyComment(body.comment_id, body.text.trim())
    let status: CommentStatus = 'resolved'
    let statusError: string | undefined
    try {
      await updateCommentStatus(body.comment_id, 'resolved')
    } catch (e) {
      // Balasan sudah terkirim ke platform — jangan blok user kalau
      // update status gagal, cukup catat errornya.
      status = 'pending'
      statusError = (e as Error).message
    }
    return NextResponse.json({ ...reply, status, ...(statusError ? { statusError } : {}) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}

// PATCH — tandai status komentar tanpa membalas. Body: { comment_id, status }
export async function PATCH(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { comment_id?: string; status?: CommentStatus }
  if (!body.comment_id || !body.status) {
    return NextResponse.json({ error: 'comment_id dan status wajib diisi' }, { status: 400 })
  }

  try {
    await updateCommentStatus(body.comment_id, body.status)
    return NextResponse.json({ commentId: body.comment_id, status: body.status })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}

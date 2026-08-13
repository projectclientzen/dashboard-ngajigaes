import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getComments, replyComment, type CommentStatus } from '@/lib/server/repliz'

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
export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { comment_id?: string; text?: string }
  if (!body.comment_id || !body.text?.trim()) {
    return NextResponse.json({ error: 'comment_id dan text wajib diisi' }, { status: 400 })
  }

  try {
    const result = await replyComment(body.comment_id, body.text.trim())
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }
}

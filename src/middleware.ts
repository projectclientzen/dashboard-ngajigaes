import { NextResponse, type NextRequest } from 'next/server'

// MVP: skip auth middleware sampai Supabase terhubung
// TODO: aktifkan setelah env NEXT_PUBLIC_SUPABASE_URL diisi
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

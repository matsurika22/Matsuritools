import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// メール認証が不要なパス
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/access-code',
  '/auth/callback',
  '/auth/confirm',
]

// 静的アセットのパス
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl

  // 静的アセットはスキップ
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return res
  }

  // セッションを取得
  const { data: { session } } = await supabase.auth.getSession()

  // パブリックパスはそのまま通す
  if (PUBLIC_PATHS.includes(pathname)) {
    return res
  }

  // 未ログインユーザーをログインページへリダイレクト
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // メール認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user && !user.email_confirmed_at) {
    // 未認証ユーザーは認証待機ページへリダイレクト
    if (pathname !== '/verify-email') {
      return NextResponse.redirect(new URL('/verify-email', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
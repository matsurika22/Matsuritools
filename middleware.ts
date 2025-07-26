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
  '/verify-email',
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
  const { pathname } = req.nextUrl

  // 静的アセットはスキップ
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    
    // セッションを更新して取得
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
    if (pathname !== '/verify-email' && !pathname.startsWith('/auth')) {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 管理者（mk0207yu1111@gmail.com）は認証チェックをスキップ
      if (user && !user.email_confirmed_at && user.email !== 'mk0207yu1111@gmail.com') {
        return NextResponse.redirect(new URL('/verify-email', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)
    return res
  }
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
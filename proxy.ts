import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

// 함수 이름을 'middleware'에서 'proxy'로 변경
export async function proxy(request: NextRequest) {
  // Supabase 세션 업데이트 및 사용자 정보 가져오기
  const { response: supabaseResponse, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // 인증이 필요한 경로
  const protectedPaths = ['/dashboard', '/trainings', '/profile']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 루트 경로는 통과
  if (pathname === '/') {
    return supabaseResponse
  }

  // 세션 확인 (user 정보가 있으면 세션이 있는 것)
  const hasSession = !!user

  // 보호된 경로에 인증 없이 접근하면 로그인 페이지로
  if (isProtectedPath && !hasSession) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 인증된 사용자가 로그인/회원가입 페이지 접근하면 대시보드로
  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
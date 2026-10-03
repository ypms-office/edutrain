'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Synchronously check localStorage to avoid flash of loading spinner
function getInitialAuthState(pathname: string): { authenticated: boolean; loading: boolean } {
  if (pathname === '/admin') {
    return { authenticated: false, loading: false }
  }
  if (typeof window !== 'undefined') {
    return {
      authenticated: localStorage.getItem('admin_authenticated') === 'true',
      loading: false,
    }
  }
  return { authenticated: false, loading: true }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const initial = getInitialAuthState(pathname)
  const [isAuthenticated, setIsAuthenticated] = useState(initial.authenticated)
  const [isLoading, setIsLoading] = useState(initial.loading)

  useEffect(() => {
    // 관리자 인증 페이지는 체크 제외
    if (pathname === '/admin') {
      setIsLoading(false)
      return
    }

    // localStorage에서 인증 상태 확인
    const adminAuth = localStorage.getItem('admin_authenticated')

    if (adminAuth !== 'true') {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      router.push('/admin')
      return
    }

    setIsAuthenticated(true)
    setIsLoading(false)

    // localStorage는 화면 표시용일 뿐 — 서버 쿠키 세션이 살아 있는지 확인
    let cancelled = false
    fetch('/api/admin/session')
      .then(res => res.json())
      .then(({ authenticated }) => {
        if (cancelled || authenticated) return
        localStorage.removeItem('admin_authenticated')
        setIsAuthenticated(false)
        router.push('/admin')
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [pathname, router])

  // 인증 페이지는 항상 렌더링
  if (pathname === '/admin') {
    return <>{children}</>
  }

  // 미인증 시 리다이렉트 대기 (빈 화면 대신 아무것도 렌더링하지 않음)
  if (isLoading || !isAuthenticated) {
    return null
  }

  return <>{children}</>
}

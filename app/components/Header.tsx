'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { ButtonSpinner } from '@/components/LoadingIndicators'

export default function Header() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userRank, setUserRank] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name, rank')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserName(profile.name)
        setUserRank(profile.rank || '')
      }
    }
  }

  const getRankColors = (rank: string) => {
    switch (rank) {
      case '교장': return 'bg-purple-100 text-purple-600 ring-purple-300'
      case '교감': return 'bg-primary-100 text-primary-600 ring-primary-300'
      case '부장': return 'bg-success-100 text-success-600 ring-success-300'
      case '교직원': return 'bg-amber-100 text-amber-600 ring-amber-300'
      default:     return 'bg-gray-100 text-gray-600 ring-gray-300'
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }


  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 & 타이틀 */}
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">교사 연수 관리 시스템</h1>
          </div>

          {/* 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg"
              prefetch={true}
            >
              대시보드
            </Link>
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center space-x-3">
            {/* 프로필 */}
            <div className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${getRankColors(userRank)}`}>
                <span className="font-semibold text-sm">
                  {userName ? userName.charAt(0) : '?'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-700">
                  {userName || '사용자'}
                </span>
                {userRank && (
                  <span className="text-xs font-medium text-gray-400">
                    {userRank}
                  </span>
                )}
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl border border-gray-200 hover:border-danger-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <>
                  <ButtonSpinner className="h-5 w-5" />
                  <span>로그아웃 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>로그아웃</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

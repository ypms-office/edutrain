'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { nameToEmail } from '@/lib/authHelpers'
import { ButtonSpinner } from '@/components/LoadingIndicators'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 이름을 내부 이메일 형식으로 변환
      const internalEmail = nameToEmail(name)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('사용자 정보를 가져올 수 없습니다.')
      }

      if (!data.session) {
        throw new Error('세션을 생성할 수 없습니다. Supabase에서 이메일 확인이 활성화되어 있는지 확인하세요.')
      }

      // 하드 리다이렉트 사용 (세션 쿠키가 확실히 설정되도록)
      window.location.href = '/dashboard'
    } catch (error: any) {
      // 사용자 친화적인 에러 메시지
      let friendlyMessage = error.message || '로그인에 실패했습니다.'

      if (error.message?.includes('Invalid login credentials')) {
        friendlyMessage = '이름 또는 비밀번호가 올바르지 않습니다.'
      } else if (error.message?.includes('Email not confirmed')) {
        friendlyMessage = '이메일 확인이 필요합니다. Supabase 설정에서 이메일 확인을 비활성화해주세요.'
      }

      setError(friendlyMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
        {/* 왼쪽: 로고 & 타이틀 */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in">
          <div className="flex flex-col items-center lg:items-center mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">교사 연수 관리 시스템</h1>
            <p className="text-base text-gray-600">간편한 연수 관리 플랫폼</p>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              관리자 모드
            </Link>
            <Link
              href="/required-trainings"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-blue-600 bg-white border border-blue-200 rounded-xl shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              필수 연수 안내
            </Link>
          </div>
        </div>

        {/* 오른쪽: 로그인 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-900 mb-5">로그인</h2>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                이름
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                maxLength={20}
                pattern="[A-Za-z\d]{6,20}"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="영문 or 숫자 6-20자"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center btn-press"
            >
              {loading ? (
                <>
                  <ButtonSpinner className="mr-2 text-white" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 하단 링크 */}
          <div className="flex justify-between text-sm">
            <Link href="/signup" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              회원가입
            </Link>
            <Link href="/reset-password" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              비밀번호 재설정
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

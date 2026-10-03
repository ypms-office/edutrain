'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ButtonSpinner } from '@/components/LoadingIndicators'
import { CreditLine } from '@/app/components/Credit'

export default function AdminAuthPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 관리자 비밀번호는 서버에서 확인한다 (성공 시 httpOnly 쿠키 발급)
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const result = await response.json().catch(() => ({}))

      if (response.status >= 500) throw new Error(result.error || '관리자 설정을 불러올 수 없습니다.')

      if (response.ok) {
        // 인증 성공 - 화면 표시용 플래그 (실제 권한은 서버 쿠키로 검사)
        localStorage.setItem('admin_authenticated', 'true')
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        setError('비밀번호가 올바르지 않습니다.')
        setLoading(false)
      }
    } catch (error: any) {
      setError(error.message || '인증에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">관리자 모드</h2>
          <p className="mt-2 text-sm text-gray-600">관리자 권한이 필요합니다</p>
        </div>

        {/* 인증 폼 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-scale-in">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                관리자 비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 btn-press"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <ButtonSpinner className="mr-2 text-white" />
                  인증 중...
                </span>
              ) : '인증'}
            </button>
          </form>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
      <CreditLine className="mt-10 w-full max-w-md border-t border-gray-200 pt-5 text-center" />
    </div>
  )
}

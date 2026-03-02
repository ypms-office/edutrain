'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ButtonSpinner } from '@/components/LoadingIndicators'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate password match
      if (newPassword !== confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다.')
      }

      // Validate password format
      if (!/^[A-Za-z\d]{6,20}$/.test(newPassword)) {
        throw new Error('비밀번호는 영문 혹은 숫자로 6-20자여야 합니다.')
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 재설정에 실패했습니다.')
      }

      setSuccess('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다...')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Reset password error:', error)
      setError(error.message || '비밀번호 재설정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
        {/* 왼쪽: 로고 & 타이틀 */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-5">
            <svg className="w-9 h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">비밀번호 재설정</h1>
          <p className="text-sm text-gray-600 mb-6">새로운 비밀번호를 설정하세요</p>
        </div>

        {/* 오른쪽: 재설정 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-900 mb-5">비밀번호 변경</h2>
          <form className="space-y-4" onSubmit={handleResetPassword}>
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
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                placeholder="홍길동"
                disabled={loading || !!success}
              />
            </div>

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                기존 비밀번호
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                minLength={6}
                maxLength={20}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                placeholder="기존 비밀번호"
                disabled={loading || !!success}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                maxLength={20}
                pattern="[A-Za-z\d]{6,20}"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                placeholder="영문 or 숫자 6-20자"
                disabled={loading || !!success}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                새 비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                maxLength={20}
                pattern="[A-Za-z\d]{6,20}"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                placeholder="영문 or 숫자 6-20자"
                disabled={loading || !!success}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ButtonSpinner className="mr-2 text-white" />
                  재설정 중...
                </>
              ) : success ? (
                <>
                  완료
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  비밀번호 재설정
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
          <div className="text-center text-sm">
            <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

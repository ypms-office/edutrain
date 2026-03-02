'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { nameToEmail } from '@/lib/authHelpers'
import { ButtonSpinner } from '@/components/LoadingIndicators'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [rank, setRank] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      // 0. 이름을 내부 이메일 형식으로 변환
      const internalEmail = nameToEmail(name)

      // 1. 이름 중복 체크
      const { data: existingUser } = await supabase
        .from('users')
        .select('name')
        .eq('name', name)
        .single()

      if (existingUser) {
        throw new Error('이미 사용 중인 이름입니다. 다른 이름을 사용해주세요.')
      }

      // 2. Supabase Auth로 회원가입 (내부 이메일 사용)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: internalEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name,
            rank,
          },
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('회원가입에 실패했습니다. 다시 시도해주세요.')
      }

      // 3. users 테이블에 추가 정보 저장
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: internalEmail,
            name,
            rank,
          },
        ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error('사용자 프로필 생성에 실패했습니다: ' + profileError.message)
      }

      // 4. 자동 로그인 (이메일 확인 불필요)
      setSuccess('회원가입이 완료되었습니다. 대시보드로 이동합니다...')
      setTimeout(() => {
        // 하드 리다이렉트 사용 (세션 쿠키가 확실히 설정되도록)
        window.location.href = '/dashboard'
      }, 1500)
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || '회원가입에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
        {/* 왼쪽: 로고 & 타이틀 */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">회원가입</h1>
          <p className="text-sm text-gray-600 mb-6">디지털 연수 관리 서비스</p>
        </div>

        {/* 오른쪽: 회원가입 폼 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 animate-scale-in">
          <h2 className="text-xl font-bold text-gray-900 mb-5">새 계정 만들기</h2>
          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                성명
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
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700 mb-1.5">
                직급
              </label>
              <select
                id="rank"
                required
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">선택하세요</option>
                <option value="교장">교장</option>
                <option value="교감">교감</option>
                <option value="부장">부장</option>
                <option value="교사">교사</option>
                <option value="교직원">교직원</option>
              </select>
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

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-xl text-sm">
                {success}
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
                  가입 중...
                </>
              ) : (
                <>
                  회원가입
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
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

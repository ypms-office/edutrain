'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageLoadingSkeleton } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useModal } from '@/components/CustomModal'

interface User {
  id: string
  name: string
  email: string
  rank: string
}

interface Training {
  id: string
  training_name: string
  institution_name: string
  training_type: string
  start_date: string
  end_date: string
  hours: number
  is_paid: boolean
  fee: number
  has_certificate: boolean
  created_at: string
}

const getRankColors = (rank: string) => {
  switch (rank) {
    case '교장': return 'bg-purple-100 text-purple-600'
    case '교감': return 'bg-primary-100 text-primary-600'
    case '부장': return 'bg-success-100 text-success-600'
    case '교직원': return 'bg-amber-100 text-amber-600'
    default:     return 'bg-gray-100 text-gray-600'
  }
}

export default function TeacherDetailPage() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const modal = useModal()

  useEffect(() => {
    loadTeacherData()
  }, [userId])

  const loadTeacherData = async () => {
    try {
      const response = await fetch(`/api/admin/teachers/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch teacher data')

      const { user: userData, trainings: trainingsData } = await response.json() as { user: User; trainings: Training[] }
      setUser(userData)
      setTrainings(trainingsData || [])
    } catch (error) {
      console.error('Failed to load teacher data:', error)
      modal.alert('교사 정보를 불러오는데 실패했습니다.', 'error')
      router.push('/admin/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    if (isNavigating) return null
    return <PageLoadingSkeleton />
  }

  if (!user) {
    return null
  }

  // 통계 계산
  const totalHours = trainings.reduce((sum, t) => sum + Number(t.hours), 0)
  const achievementRate = Math.min((totalHours / 60) * 100, 100)
  const certificateCount = trainings.filter(t => t.has_certificate).length

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-success-600'
    if (rate >= 50) return 'bg-warning-600'
    return 'bg-danger-600'
  }

  const getProgressTextColor = (rate: number) => {
    if (rate >= 80) return 'text-success-700'
    if (rate >= 50) return 'text-warning-700'
    return 'text-danger-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">교사 상세 정보</h1>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 교사 프로필 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-8 animate-stagger-in stagger-1">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${getRankColors(user.rank)}`}>
              <span className="font-bold text-lg">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
              <span className="inline-flex px-2.5 py-0.5 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                {user.rank}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-stagger-in stagger-2">
          {/* 총 이수 시간 */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-white/80">총 이수 시간</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">{totalHours.toFixed(1)}</span>
              <span className="text-xs text-white/60">/ 60h</span>
            </div>
          </div>

          {/* 달성률 */}
          <div className="bg-gradient-to-r from-success-500 to-success-600 rounded-xl px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-white/80">달성률</span>
            </div>
            <span className="text-2xl font-bold">{achievementRate.toFixed(1)}%</span>
          </div>

          {/* 이수중 미등록 */}
          <div className="bg-gradient-to-r from-warning-500 to-warning-600 rounded-xl px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium text-white/80">이수중 미등록</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold">{trainings.length - certificateCount}</span>
              <span className="text-xs text-white/60">/ {trainings.length}개</span>
            </div>
          </div>
        </div>

        {/* 연수 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">연수 목록</h3>
          </div>

          {trainings.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">등록된 연수가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">연번</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">연수명</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">기관</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">구분</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">시작일</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">종료일</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">이수시간</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">연수비</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">이수증</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainings.map((training, index) => (
                    <tr key={training.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-base text-gray-900">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 text-base font-medium text-gray-900 max-w-xs">
                        {training.training_name}
                      </td>
                      <td className="px-4 py-3 text-base text-gray-600 max-w-xs">
                        {training.institution_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          training.training_type === '직무(원격)' ? 'bg-primary-50 text-primary-700' :
                          training.training_type === '직무(집합)' ? 'bg-info-50 text-info-700' :
                          'bg-success-50 text-success-700'
                        }`}>
                          {training.training_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base text-gray-600">
                        {new Date(training.start_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-base text-gray-600">
                        {new Date(training.end_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-base font-semibold text-gray-900">
                        {training.hours}h
                      </td>
                      <td className="px-4 py-3 text-base text-gray-600">
                        {training.is_paid ? `₩${training.fee.toLocaleString()}` : '무료'}
                      </td>
                      <td className="px-4 py-3">
                        {training.has_certificate ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-success-100 text-success-700">
                            등록완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-danger-50 text-danger-700">
                            미등록
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 테이블 하단 요약 */}
          {trainings.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{trainings.length}</span>개의 연수
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

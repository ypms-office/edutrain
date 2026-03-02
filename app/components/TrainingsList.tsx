'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Spinner, ButtonSpinner } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useDebounce } from '@/lib/useDebounce'
import { useModal } from '@/components/CustomModal'

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

export default function TrainingsList() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 200)
  const [filterType, setFilterType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const modal = useModal()

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('trainings')
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setTrainings(data || [])
    } catch (error) {
      console.error('Error loading trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await modal.confirm('이 연수를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')
    if (!confirmed) return

    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Optimistic local removal instead of full refetch
      setTrainings(prev => prev.filter(t => t.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Error deleting training:', error)
      await modal.alert('연수 삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setDeletingId(null)
    }
  }, [router, modal])

  // Memoize filtered data to avoid recalculation on every render
  const filteredTrainings = useMemo(() => {
    return trainings.filter(training => {
      const matchesSearch = !debouncedSearch ||
        training.training_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        training.institution_name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesType = !filterType || training.training_type === filterType
      return matchesSearch && matchesType
    })
  }, [trainings, debouncedSearch, filterType])

  // Memoize pagination calculations
  const totalPages = Math.ceil(filteredTrainings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTrainings = useMemo(() =>
    filteredTrainings.slice(startIndex, endIndex),
    [filteredTrainings, startIndex, endIndex]
  )

  if (loading) {
    if (isNavigating) return null
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Spinner size="md" className="mx-auto" />
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-scale-in">
      {/* 테이블 헤더 영역 */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">연수 목록</h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="연수명 또는 기관 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 필터 */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">모든 구분</option>
              <option value="직무(원격)">직무(원격)</option>
              <option value="직무(집합)">직무(집합)</option>
              <option value="직무(혼합)">직무(혼합)</option>
            </select>

            {/* 연수 등록 버튼 */}
            <button
              onClick={() => {
                setNavigatingTo('new')
                router.push('/trainings/new')
              }}
              disabled={navigatingTo === 'new'}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center btn-press"
            >
              {navigatingTo === 'new' ? (
                <>
                  <ButtonSpinner className="mr-1.5 h-4 w-4 text-white" />
                  이동 중...
                </>
              ) : (
                '+ 연수 등록'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {currentTrainings.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">등록된 연수가 없습니다.</p>
          <button
            onClick={() => {
              setNavigatingTo('new')
              router.push('/trainings/new')
            }}
            disabled={navigatingTo === 'new'}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
          >
            {navigatingTo === 'new' ? (
              <>
                <ButtonSpinner className="mr-1.5 h-4 w-4 text-white" />
                이동 중...
              </>
            ) : (
              '첫 번째 연수 등록하기'
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[60px]">연번</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">연수명</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">기관</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[90px]">구분</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[100px]">시작일</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[100px]">종료일</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[80px]">이수시간</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[70px]">연수비</th>
                  <th className="px-3 py-2.5 text-left text-sm font-semibold text-gray-600 whitespace-nowrap w-[100px]">이수증</th>
                  <th className="px-3 py-2.5 text-center text-sm font-semibold text-gray-600 whitespace-nowrap w-[80px]">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTrainings.map((training, index) => (
                  <tr key={training.id} className="hover:bg-gray-50 transition-colors animate-stagger-in" style={{ animationDelay: `${index * 0.04}s` }}>
                    <td className="px-3 py-2.5 text-base text-gray-900 whitespace-nowrap">
                      {String(startIndex + index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-2.5 text-base font-medium text-gray-900">
                      <div className="max-w-[240px] break-words">{training.training_name}</div>
                    </td>
                    <td className="px-3 py-2.5 text-base text-gray-600">
                      <div className="truncate max-w-[180px]">{training.institution_name}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                        training.training_type === '직무(원격)' ? 'bg-primary-50 text-primary-700' :
                        training.training_type === '직무(집합)' ? 'bg-info-50 text-info-700' :
                        'bg-success-50 text-success-700'
                      }`}>
                        {training.training_type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-base text-gray-600 whitespace-nowrap">
                      {new Date(training.start_date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-3 py-2.5 text-base text-gray-600 whitespace-nowrap">
                      {new Date(training.end_date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-3 py-2.5 text-base font-semibold text-gray-900 whitespace-nowrap">
                      {training.hours}h
                    </td>
                    <td className="px-3 py-2.5 text-base text-gray-600 whitespace-nowrap">
                      {training.is_paid ? `₩${training.fee.toLocaleString()}` : '무료'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {training.has_certificate ? (
                        <button
                          onClick={() => {
                            setNavigatingTo(`cert-${training.id}`)
                            router.push(`/trainings/${training.id}/certificate`)
                          }}
                          disabled={navigatingTo === `cert-${training.id}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-success-50 text-success-700 cursor-pointer hover:bg-success-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {navigatingTo === `cert-${training.id}` ? (
                            <>
                              <ButtonSpinner className="mr-1 h-3.5 w-3.5 text-success-700" />
                              이동 중...
                            </>
                          ) : (
                            '✓ 등록완료'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setNavigatingTo(`cert-${training.id}`)
                            router.push(`/trainings/${training.id}/certificate`)
                          }}
                          disabled={navigatingTo === `cert-${training.id}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-danger-50 text-danger-700 cursor-pointer hover:bg-danger-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {navigatingTo === `cert-${training.id}` ? (
                            <>
                              <ButtonSpinner className="mr-1 h-3.5 w-3.5 text-danger-700" />
                              이동 중...
                            </>
                          ) : (
                            '+ 미등록'
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setNavigatingTo(`edit-${training.id}`)
                            router.push(`/trainings/${training.id}/edit`)
                          }}
                          disabled={navigatingTo === `edit-${training.id}`}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="수정"
                        >
                          {navigatingTo === `edit-${training.id}` ? (
                            <svg className="animate-spin w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(training.id)}
                          disabled={deletingId === training.id}
                          className="p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="삭제"
                        >
                          {deletingId === training.id ? (
                            <svg className="animate-spin w-5 h-5 text-danger-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  전체 <span className="font-semibold">{filteredTrainings.length}</span>개 중 {startIndex + 1} - {Math.min(endIndex, filteredTrainings.length)} 표시
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-colors"
                  >
                    &lt; 이전
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium btn-press transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-colors"
                  >
                    다음 &gt;
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

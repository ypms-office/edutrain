'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/LoadingIndicators'

interface RequiredTraining {
  id: string
  name: string
  url: string
  display_order: number
}

export default function RequiredTrainingsBridgePage() {
  const [trainings, setTrainings] = useState<RequiredTraining[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('required_trainings')
        .select('id, name, url, display_order')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setTrainings(data || [])
    } catch (error) {
      console.error('Failed to load required trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full animate-fade-in">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-5">
            <svg className="w-9 h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">필수 연수 안내</h1>
          <p className="text-sm text-gray-600">아래 목록에서 필수 연수를 확인하고 바로 이동하세요</p>
        </div>

        {/* 연수 목록 카드 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" className="mx-auto" />
            </div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-16 px-6">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-lg">등록된 필수 연수가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">관리자가 필수 연수를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trainings.map((training, index) => (
                <a
                  key={training.id}
                  href={training.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-4 hover:bg-blue-50 transition-colors group animate-stagger-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* 번호 뱃지 */}
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    {index + 1}
                  </div>

                  {/* 연수명 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                      {training.name}
                    </p>
                  </div>

                  {/* 이동 아이콘 */}
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center group-hover:bg-blue-700 group-hover:scale-110 transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* 하단 안내 */}
          {!loading && trainings.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                총 {trainings.length}개의 필수 연수 | 클릭하면 해당 교육 기관 사이트로 이동합니다
              </p>
            </div>
          )}
        </div>

        {/* 돌아가기 */}
        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/app/components/Header'
import TrainingsList from '@/app/components/TrainingsList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 사용자 정보와 연수 통계를 병렬로 가져오기
  const [{ data: profile }, { data: trainings }] = await Promise.all([
    supabase
      .from('users')
      .select('name, rank')
      .eq('id', user.id)
      .single(),
    supabase
      .from('trainings')
      .select('hours, has_certificate')
      .eq('user_id', user.id),
  ])

  const totalHours = trainings?.reduce((sum, t) => sum + Number(t.hours), 0) || 0
  const achievementRate = Math.min((totalHours / 60) * 100, 100)
  const certificatesCount = trainings?.filter(t => t.has_certificate).length || 0
  const missingCertificates = (trainings?.length || 0) - certificatesCount
  const totalTrainings = trainings?.length || 0
  const certificateRate = totalTrainings > 0 ? (certificatesCount / totalTrainings) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">나의 대시보드</h1>
          <p className="mt-2 text-gray-600">
            {profile?.name}님, 환영합니다! ({profile?.rank})
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 총 이수시간 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 card-hover animate-stagger-in stagger-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-600">총 이수시간</span>
              </div>
              <div className="text-4xl font-bold text-gray-900">
                {totalHours.toFixed(1)}<span className="text-2xl text-gray-600 ml-1">시간</span>
              </div>
            </div>

            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${achievementRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1.5 text-sm text-gray-500">
                <span>{totalHours.toFixed(1)}시간 완료</span>
                <span>목표 60시간</span>
              </div>
            </div>
          </div>

          {/* 목표 달성률 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 card-hover animate-stagger-in stagger-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-600">목표 달성률</span>
              </div>
              <div className="text-4xl font-bold text-gray-900">
                {achievementRate.toFixed(0)}<span className="text-2xl text-gray-600 ml-1">%</span>
              </div>
            </div>

            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-success-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${achievementRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1.5 text-sm text-gray-500">
                <span>{totalHours.toFixed(1)}시간 완료</span>
                <span>목표 60시간</span>
              </div>
            </div>
          </div>

          {/* 이수증 현황 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 card-hover animate-stagger-in stagger-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-base font-medium text-gray-600">이수증 미등록 현황</span>
              </div>
              <span className="text-danger-600 font-bold text-3xl">
                {missingCertificates}<span className="text-xl ml-0.5">건</span>
              </span>
            </div>

            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-warning-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${certificateRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1.5 text-sm text-gray-500">
                <span>등록완료 {certificatesCount}건</span>
                <span>전체 {totalTrainings}건</span>
              </div>
            </div>
          </div>
        </div>

        {/* 연수 목록 */}
        <div className="animate-stagger-in stagger-4">
          <TrainingsList />
        </div>
      </main>
    </div>
  )
}

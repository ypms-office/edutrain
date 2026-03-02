'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/app/components/Header'
import { Spinner, ButtonSpinner } from '@/components/LoadingIndicators'
import DateRangePicker from '@/components/DateRangePicker'
import { useModal } from '@/components/CustomModal'

interface MasterData {
  id: string
  name: string
}

interface Training {
  id: string
  user_id: string
  training_name: string
  institution_name: string
  training_type: string
  start_date: string
  end_date: string
  hours: number
  is_paid: boolean
  fee: number
  has_certificate: boolean
}

export default function EditTrainingPage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params.id as string
  const supabase = createClient()

  // Master data
  const [trainingNames, setTrainingNames] = useState<MasterData[]>([])
  const [institutions, setInstitutions] = useState<MasterData[]>([])

  // Form state
  const [formData, setFormData] = useState({
    training_name: '',
    institution_name: '',
    training_type: '직무(원격)',
    start_date: '',
    end_date: '',
    hours: '',
    is_paid: false,
    fee: ''
  })

  // Custom input toggles
  const [useCustomTraining, setUseCustomTraining] = useState(false)
  const [useCustomInstitution, setUseCustomInstitution] = useState(false)
  const [customTrainingName, setCustomTrainingName] = useState('')
  const [customInstitutionName, setCustomInstitutionName] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const modal = useModal()

  useEffect(() => {
    loadAllData()
  }, [trainingId])

  const loadAllData = async () => {
    try {
      setLoading(true)

      // Run all queries in parallel (auth, master data, training data)
      const [authResult, trainingsNamesResult, institutionsResult, trainingResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('master_training_names')
          .select('id, name')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('master_institutions')
          .select('id, name')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('trainings')
          .select('id, user_id, training_name, institution_name, training_type, start_date, end_date, hours, is_paid, fee, has_certificate')
          .eq('id', trainingId)
          .single()
      ])

      if (!authResult.data.user) {
        router.push('/login')
        return
      }

      const masterTrainings = trainingsNamesResult.data || []
      const masterInstitutions = institutionsResult.data || []
      setTrainingNames(masterTrainings)
      setInstitutions(masterInstitutions)

      if (trainingResult.error) throw trainingResult.error
      const data = trainingResult.data

      if (!data || data.user_id !== authResult.data.user.id) {
        setError('연수를 찾을 수 없습니다.')
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      // Check if values are in master data (now using fresh data, not stale state)
      const isTrainingInMaster = masterTrainings.some(t => t.name === data.training_name)
      const isInstitutionInMaster = masterInstitutions.some(i => i.name === data.institution_name)

      setFormData({
        training_name: isTrainingInMaster ? data.training_name : '',
        institution_name: isInstitutionInMaster ? data.institution_name : '',
        training_type: data.training_type,
        start_date: data.start_date,
        end_date: data.end_date,
        hours: data.hours.toString(),
        is_paid: data.is_paid,
        fee: data.fee.toString()
      })

      if (!isTrainingInMaster) {
        setUseCustomTraining(true)
        setCustomTrainingName(data.training_name)
      }

      if (!isInstitutionInMaster) {
        setUseCustomInstitution(true)
        setCustomInstitutionName(data.institution_name)
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || '연수 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validation
      const finalTrainingName = useCustomTraining ? customTrainingName : formData.training_name
      const finalInstitutionName = useCustomInstitution ? customInstitutionName : formData.institution_name

      if (!finalTrainingName || !finalInstitutionName || !formData.start_date || !formData.end_date || !formData.hours) {
        setError('모든 필수 항목을 입력해주세요.')
        setSaving(false)
        return
      }

      const hours = parseFloat(formData.hours)
      if (isNaN(hours) || hours <= 0) {
        setError('올바른 이수시간을 입력해주세요.')
        setSaving(false)
        return
      }

      if (formData.is_paid && (!formData.fee || parseInt(formData.fee) <= 0)) {
        setError('유료 연수인 경우 연수비를 입력해주세요.')
        setSaving(false)
        return
      }

      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('종료일은 시작일보다 이후여야 합니다.')
        setSaving(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update training
      const { error: updateError } = await supabase
        .from('trainings')
        .update({
          training_name: finalTrainingName,
          institution_name: finalInstitutionName,
          training_type: formData.training_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          hours: hours,
          is_paid: formData.is_paid,
          fee: formData.is_paid ? parseInt(formData.fee) : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Error updating training:', err)
      setError(err.message || '연수 수정 중 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await modal.confirm('이 연수를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')
    if (!confirmed) return

    setDeleting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error: deleteError } = await supabase
        .from('trainings')
        .delete()
        .eq('id', trainingId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting training:', err)
      await modal.alert(err.message || '연수 삭제 중 오류가 발생했습니다.', 'error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="mt-4 text-gray-600">연수 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">연수 수정</h1>
          <p className="mt-2 text-gray-600">연수 이수 내역을 수정합니다.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-scale-in">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg animate-shake">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-danger-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-danger-800">{error}</span>
                </div>
              </div>
            )}

            {/* Training Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                연수명 <span className="text-danger-600">*</span>
              </label>
              {!useCustomTraining ? (
                <div className="space-y-2">
                  <select
                    value={formData.training_name}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setUseCustomTraining(true)
                        setFormData({ ...formData, training_name: '' })
                      } else {
                        setFormData({ ...formData, training_name: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">연수를 선택하세요</option>
                    {trainingNames.map((training) => (
                      <option key={training.id} value={training.name}>
                        {training.name}
                      </option>
                    ))}
                    <option value="custom">직접 입력</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customTrainingName}
                    onChange={(e) => setCustomTrainingName(e.target.value)}
                    placeholder="연수명을 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomTraining(false)
                      setCustomTrainingName('')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    목록에서 선택하기
                  </button>
                </div>
              )}
            </div>

            {/* Institution Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                기관명 <span className="text-danger-600">*</span>
              </label>
              {!useCustomInstitution ? (
                <div className="space-y-2">
                  <select
                    value={formData.institution_name}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setUseCustomInstitution(true)
                        setFormData({ ...formData, institution_name: '' })
                      } else {
                        setFormData({ ...formData, institution_name: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">기관을 선택하세요</option>
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.name}>
                        {institution.name}
                      </option>
                    ))}
                    <option value="custom">직접 입력</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customInstitutionName}
                    onChange={(e) => setCustomInstitutionName(e.target.value)}
                    placeholder="기관명을 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomInstitution(false)
                      setCustomInstitutionName('')
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    목록에서 선택하기
                  </button>
                </div>
              )}
            </div>

            {/* Training Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                연수 구분 <span className="text-danger-600">*</span>
              </label>
              <div className="flex space-x-4">
                {['직무(원격)', '직무(집합)', '직무(혼합)'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="training_type"
                      value={type}
                      checked={formData.training_type === type}
                      onChange={(e) => setFormData({ ...formData, training_type: e.target.value })}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <DateRangePicker
              startDate={formData.start_date}
              endDate={formData.end_date}
              onDateChange={(start, end) => setFormData(prev => ({ ...prev, start_date: start, end_date: end }))}
            />

            {/* Hours */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이수시간 <span className="text-danger-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="15"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">시간</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">소수점 둘째 자리까지 입력 가능합니다. (예: 1.5, 2.25, 15.75)</p>
            </div>

            {/* Is Paid Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                연수비 구분 <span className="text-danger-600">*</span>
              </label>
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_paid: false, fee: '' })}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                    !formData.is_paid
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  무료
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_paid: true })}
                  className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                    formData.is_paid
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  유료
                </button>
              </div>
            </div>

            {/* Fee (conditional) */}
            {formData.is_paid && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  연수비 <span className="text-danger-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    placeholder="50000"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required={formData.is_paid}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {/* Delete Button */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving || cancelling}
                className="px-6 py-2.5 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center">
                    <ButtonSpinner className="-ml-1 mr-2 h-4 w-4 text-white" />
                    삭제 중...
                  </span>
                ) : (
                  '삭제'
                )}
              </button>

              {/* Save/Cancel Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setCancelling(true)
                    router.push('/dashboard')
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving || deleting || cancelling}
                >
                  {cancelling ? (
                    <>
                      <ButtonSpinner className="mr-1.5 h-4 w-4 text-gray-700" />
                      이동 중...
                    </>
                  ) : (
                    '취소'
                  )}
                </button>
                <button
                  type="submit"
                  disabled={saving || deleting || cancelling}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <ButtonSpinner className="-ml-1 mr-2 h-4 w-4 text-white" />
                      저장 중...
                    </span>
                  ) : (
                    '저장'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import { ButtonSpinner } from '@/components/LoadingIndicators'
import DateRangePicker from '@/components/DateRangePicker'
import {
  uploadCertificate,
  validateFile,
  formatFileSize,
  MAX_FILE_SIZE,
} from '@/lib/uploadHelpers'

interface MasterData {
  id: string
  name: string
}

export default function NewTrainingPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Certificate file state
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')

  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    // Run auth check and master data loading in parallel
    const [authResult, trainingsResult, institutionsResult] = await Promise.all([
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
        .order('display_order', { ascending: true })
    ])

    if (!authResult.data.user) {
      router.push('/login')
      return
    }

    if (trainingsResult.data) setTrainingNames(trainingsResult.data)
    if (institutionsResult.data) setInstitutions(institutionsResult.data)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    const files = e.target.files

    if (files && files.length > 0) {
      const file = files[0]
      const validation = validateFile(file)

      if (!validation.valid) {
        setFileError(validation.error || '유효하지 않은 파일입니다.')
        setCertificateFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      setCertificateFile(file)
    }
  }

  const handleRemoveFile = () => {
    setCertificateFile(null)
    setFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      const finalTrainingName = useCustomTraining ? customTrainingName : formData.training_name
      const finalInstitutionName = useCustomInstitution ? customInstitutionName : formData.institution_name

      if (!finalTrainingName || !finalInstitutionName || !formData.start_date || !formData.end_date || !formData.hours) {
        setError('모든 필수 항목을 입력해주세요.')
        setLoading(false)
        return
      }

      const hours = parseFloat(formData.hours)
      if (isNaN(hours) || hours <= 0) {
        setError('올바른 이수시간을 입력해주세요.')
        setLoading(false)
        return
      }

      if (formData.is_paid && (!formData.fee || parseInt(formData.fee) <= 0)) {
        setError('유료 연수인 경우 연수비를 입력해주세요.')
        setLoading(false)
        return
      }

      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('종료일은 시작일보다 이후여야 합니다.')
        setLoading(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check for duplicate training name
      const { data: existingTrainings, error: checkError } = await supabase
        .from('trainings')
        .select('training_name')
        .eq('user_id', user.id)
        .eq('training_name', finalTrainingName)

      if (checkError) throw checkError

      if (existingTrainings && existingTrainings.length > 0) {
        setError('이미 등록된 연수명입니다. 다른 이름으로 등록해주세요.')
        setLoading(false)
        return
      }

      // Insert training and get the created record
      const { data: newTraining, error: insertError } = await supabase
        .from('trainings')
        .insert({
          user_id: user.id,
          training_name: finalTrainingName,
          institution_name: finalInstitutionName,
          training_type: formData.training_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          hours: hours,
          is_paid: formData.is_paid,
          fee: formData.is_paid ? parseInt(formData.fee) : 0,
          has_certificate: false
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload certificate if provided
      if (certificateFile && newTraining) {
        const uploadResult = await uploadCertificate(certificateFile, user.id, newTraining.id)

        if (!uploadResult.success) {
          console.error('Certificate upload error:', uploadResult.error)
          // Don't fail the entire operation, just show a warning
          setError('연수는 등록되었으나 이수증 업로드에 실패했습니다. 연수 목록에서 다시 업로드해주세요.')
          setTimeout(() => {
            router.push('/dashboard')
            router.refresh()
          }, 3000)
          setLoading(false)
          return
        }
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Error creating training:', err)
      setError(err.message || '연수 등록 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">연수 등록</h1>
          <p className="mt-2 text-gray-600">새로운 연수 이수 내역을 등록합니다.</p>
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

            {/* Certificate Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이수증 파일 (선택사항)
              </label>
              <div className="space-y-3">
                {!certificateFile ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-center"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm text-gray-600">이수증 파일 선택</span>
                      </div>
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF, JPG, PNG 파일 | 최대 {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-success-50 border border-success-200 rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      <svg className="w-5 h-5 text-success-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-success-900 truncate">{certificateFile.name}</p>
                        <p className="text-xs text-success-700">{formatFileSize(certificateFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="ml-3 p-1 text-success-600 hover:text-success-800 hover:bg-success-100 rounded transition-colors flex-shrink-0"
                      title="파일 제거"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {fileError && (
                  <p className="text-sm text-danger-600">{fileError}</p>
                )}
                <p className="text-xs text-gray-500">
                  연수 등록 시 이수증을 함께 업로드할 수 있습니다. 나중에 추가하려면 연수 목록에서 등록할 수도 있습니다.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setCancelling(true)
                  router.push('/dashboard')
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={loading || cancelling}
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
                disabled={loading || cancelling}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <ButtonSpinner className="-ml-1 mr-2 h-4 w-4 text-white" />
                    등록 중...
                  </span>
                ) : (
                  '연수 등록'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

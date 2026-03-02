'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/app/components/Header'
import { Spinner, ButtonSpinner } from '@/components/LoadingIndicators'
import { useModal } from '@/components/CustomModal'
import {
  uploadCertificate,
  deleteCertificate,
  downloadCertificate,
  formatFileSize,
  validateFile,
  MAX_FILE_SIZE,
} from '@/lib/uploadHelpers'

interface Training {
  id: string
  training_name: string
  institution_name: string
  training_type: string
  start_date: string
  end_date: string
  hours: number
  has_certificate: boolean
}

interface Certificate {
  id: string
  training_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [training, setTraining] = useState<Training | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const modal = useModal()

  useEffect(() => {
    loadData()
  }, [trainingId])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load training data with specific columns
      const { data: trainingData, error: trainingError } = await supabase
        .from('trainings')
        .select('id, training_name, institution_name, training_type, start_date, end_date, hours, has_certificate')
        .eq('id', trainingId)
        .eq('user_id', user.id)
        .single()

      if (trainingError) throw trainingError

      if (!trainingData) {
        setError('연수를 찾을 수 없습니다.')
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      setTraining(trainingData)

      // Load certificate data and signed URL together if exists
      if (trainingData.has_certificate) {
        const { data: certData } = await supabase
          .from('certificates')
          .select('id, training_id, file_name, file_path, file_size, file_type, created_at')
          .eq('training_id', trainingId)
          .single()

        if (certData) {
          setCertificate(certData)

          // Generate signed URL immediately (avoid separate useEffect cycle)
          if (certData.file_type.startsWith('image/')) {
            const { data: urlData } = await supabase.storage
              .from('certificates')
              .createSignedUrl(certData.file_path, 3600)
            if (urlData?.signedUrl) {
              setPreviewUrl(urlData.signedUrl)
            }
          }
        }
      } else {
        setCertificate(null)
        setPreviewUrl('')
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [trainingId, router])

  const handleFileSelect = async (file: File) => {
    setError('')
    setSuccess('')

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || '유효하지 않은 파일입니다.')
      return
    }

    // Upload file
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('로그인이 필요합니다.')
        return
      }

      const result = await uploadCertificate(file, user.id, trainingId)

      if (!result.success) {
        setError(result.error || '업로드 중 오류가 발생했습니다.')
        return
      }

      setSuccess('이수증이 성공적으로 업로드되었습니다.')

      // Reload data
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDownload = async () => {
    if (!certificate) return

    setDownloading(true)
    setError('')
    try {
      const result = await downloadCertificate(certificate.file_path, certificate.file_name)

      if (!result.success) {
        setError(result.error || '다운로드 중 오류가 발생했습니다.')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!certificate) return

    const confirmed = await modal.confirm('이수증을 삭제하시겠습니까? 삭제된 파일은 복구할 수 없습니다.')
    if (!confirmed) return

    setDeleting(true)
    setError('')

    try {
      const result = await deleteCertificate(certificate.file_path, trainingId)

      if (!result.success) {
        setError(result.error || '삭제 중 오류가 발생했습니다.')
        return
      }

      setSuccess('이수증이 성공적으로 삭제되었습니다.')
      setCertificate(null)
      setPreviewUrl('')

      // Reload data
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Spinner size="md" className="mx-auto" />
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600">연수를 찾을 수 없습니다.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">이수증 관리</h1>
              <p className="mt-2 text-gray-600">연수 이수증을 업로드하고 관리합니다.</p>
            </div>
            <button
              onClick={() => {
                setNavigating(true)
                router.push('/dashboard')
              }}
              disabled={navigating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {navigating ? (
                <>
                  <ButtonSpinner className="mr-1.5 h-4 w-4 text-gray-700" />
                  이동 중...
                </>
              ) : (
                '목록으로'
              )}
            </button>
          </div>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-danger-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-danger-800">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-success-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-success-800">{success}</span>
            </div>
          </div>
        )}

        {/* Training Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mb-6 animate-stagger-in stagger-1">
          <div className="flex items-center justify-between flex-wrap gap-x-6 gap-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{training.training_name}</h2>
              <span className="text-sm text-gray-400 flex-shrink-0">|</span>
              <span className="text-sm text-gray-600 flex-shrink-0">{training.institution_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
              <span>{new Date(training.start_date).toLocaleDateString('ko-KR')} ~ {new Date(training.end_date).toLocaleDateString('ko-KR')}</span>
              <span className="font-semibold text-gray-700">{training.hours}시간</span>
            </div>
          </div>
        </div>

        {/* Certificate Upload/Display Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-stagger-in stagger-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이수증</h2>

          {!certificate ? (
            /* Upload Area */
            <div>
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={uploading}
                />

                {uploading ? (
                  <div>
                    <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-medium text-gray-900">업로드 중...</p>
                    <p className="text-sm text-gray-600 mt-2">잠시만 기다려주세요.</p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      이수증 파일을 업로드하세요
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      드래그 앤 드롭 또는 클릭하여 파일 선택
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      파일 선택
                    </button>
                    <p className="text-xs text-gray-500 mt-4">
                      PDF, JPG, PNG 파일 | 최대 {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Certificate Display Area */
            <div className="space-y-6">
              {/* Certificate Preview */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">등록된 이수증</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(certificate.created_at).toLocaleDateString('ko-KR')} 업로드
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700">
                    등록완료
                  </span>
                </div>

                {/* Preview */}
                {isImage(certificate.file_type) && previewUrl ? (
                  <div className="mb-4">
                    <img
                      src={previewUrl}
                      alt="Certificate preview"
                      className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center p-12 bg-white rounded-lg border border-gray-200">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-20 w-20 text-danger-500 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-lg font-medium text-gray-900">PDF 파일</p>
                      <p className="text-sm text-gray-600 mt-1">{certificate.file_name}</p>
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">파일명</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 truncate" title={certificate.file_name}>
                      {certificate.file_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">파일 크기</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatFileSize(certificate.file_size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">파일 형식</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 uppercase">
                      {certificate.file_type.split('/')[1] || certificate.file_type}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleDownload}
                    disabled={downloading || deleting}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <ButtonSpinner className="mr-2 h-5 w-5 text-white" />
                        다운로드 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        다운로드
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || downloading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-gray-50 text-danger-600 font-medium rounded-lg border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-danger-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        삭제 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        삭제
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Upload New Certificate Option */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  새로운 이수증을 업로드하려면 먼저 기존 파일을 삭제해주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

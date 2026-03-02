'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageLoadingSkeleton, ButtonSpinner } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useDebounce } from '@/lib/useDebounce'
import { useModal } from '@/components/CustomModal'

interface User {
  id: string
  email: string
  name: string
  rank: string
}

interface Training {
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

interface Teacher {
  id: string
  name: string
  rank: string
  totalHours: number
  achievementRate: number
  hasCertificate: boolean
  certificateCount: number
  totalTrainings: number
}

interface CertificateWithUser {
  id: string
  training_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
  user_name: string
  user_rank: string
}

const RANK_ORDER: { [key: string]: number } = {
  '교장': 1,
  '교감': 2,
  '부장': 3,
  '교사': 4,
  '교직원': 5
}

const sortByRankAndName = <T extends { rank?: string; user_rank?: string; name?: string; user_name?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const rankA = RANK_ORDER[(a as any).rank || (a as any).user_rank] || 999
    const rankB = RANK_ORDER[(b as any).rank || (b as any).user_rank] || 999
    if (rankA !== rankB) return rankA - rankB
    const nameA = (a as any).name || (a as any).user_name || ''
    const nameB = (b as any).name || (b as any).user_name || ''
    return nameA.localeCompare(nameB, 'ko-KR')
  })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 200)
  const [trainingFilter, setTrainingFilter] = useState<string>('all')
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [exporting, setExporting] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const modal = useModal()

  // Cache raw data for reuse in Excel/PDF downloads (avoid redundant API calls)
  const cachedUsersRef = useRef<User[]>([])
  const cachedTrainingsRef = useRef<Training[]>([])

  useEffect(() => {
    loadTeacherData()
  }, [])

  const loadTeacherData = async () => {
    try {
      // Fetch users and trainings in parallel
      const [usersResponse, trainingsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/trainings')
      ])

      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      if (!trainingsResponse.ok) throw new Error('Failed to fetch trainings')

      const [{ users }, { trainings }] = await Promise.all([
        usersResponse.json() as Promise<{ users: User[] }>,
        trainingsResponse.json() as Promise<{ trainings: Training[] }>
      ])

      // Cache for reuse in exports
      cachedUsersRef.current = users
      cachedTrainingsRef.current = trainings

      setAllTrainings(trainings)

      // Build training lookup map for O(1) access
      const trainingsByUser = new Map<string, Training[]>()
      for (const t of trainings) {
        const existing = trainingsByUser.get(t.user_id)
        if (existing) {
          existing.push(t)
        } else {
          trainingsByUser.set(t.user_id, [t])
        }
      }

      // 교사별 통계 계산
      const teacherStats: Teacher[] = users.map((user: User) => {
        const userTrainings = trainingsByUser.get(user.id) || []
        const totalHours = userTrainings.reduce((sum, t) => sum + Number(t.hours), 0)
        const achievementRate = Math.min((totalHours / 60) * 100, 100)
        const certificateCount = userTrainings.filter(t => t.has_certificate).length
        const hasCertificate = certificateCount === userTrainings.length && userTrainings.length > 0

        return {
          id: user.id,
          name: user.name,
          rank: user.rank,
          totalHours,
          achievementRate,
          hasCertificate,
          certificateCount,
          totalTrainings: userTrainings.length
        }
      })

      setTeachers(teacherStats)
    } catch (error) {
      console.error('Failed to load teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize unique training names
  const uniqueTrainingNames = useMemo(() => {
    const names = new Set(allTrainings.map(t => t.training_name))
    return Array.from(names).sort()
  }, [allTrainings])

  // Memoize user IDs for training filter
  const userIdsWithTraining = useMemo(() => {
    if (trainingFilter === 'all') return null
    return new Set(
      allTrainings
        .filter(t => t.training_name === trainingFilter)
        .map(t => t.user_id)
    )
  }, [trainingFilter, allTrainings])

  // Memoize filtered + sorted teachers
  const filteredTeachers = useMemo(() => {
    let filtered = teachers

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      filtered = filtered.filter(t => t.name.toLowerCase().includes(term))
    }

    if (userIdsWithTraining) {
      filtered = filtered.filter(t => userIdsWithTraining.has(t.id))
    }

    return sortByRankAndName(filtered)
  }, [teachers, debouncedSearch, userIdsWithTraining])

  // Memoize overall statistics
  const { overallAchievementRate, certificateCompletionRate } = useMemo(() => {
    const avgRate = teachers.length > 0
      ? teachers.reduce((sum, t) => sum + t.achievementRate, 0) / teachers.length
      : 0
    const withAllCerts = teachers.filter(t => t.hasCertificate && t.totalTrainings > 0).length
    const withTrainings = teachers.filter(t => t.totalTrainings > 0).length
    const certRate = withTrainings > 0 ? (withAllCerts / withTrainings) * 100 : 0
    return { overallAchievementRate: avgRate, certificateCompletionRate: certRate }
  }, [teachers])

  const handleLogout = () => {
    setLoggingOut(true)
    localStorage.removeItem('admin_authenticated')
    router.push('/')
  }

  const handleExcelDownload = async () => {
    try {
      setExporting(true)

      const XLSX = await import('xlsx')

      // Use cached data instead of redundant API calls
      const users = cachedUsersRef.current
      const trainings = cachedTrainingsRef.current

      // Build user lookup map for O(1) access
      const userMap = new Map(users.map(u => [u.id, u]))

      // Join user and training data
      const exportData = trainings.map((training: Training) => {
        const user = userMap.get(training.user_id)
        return {
          name: user?.name || '',
          rank: user?.rank || '',
          email: user?.email || '',
          training_name: training.training_name,
          institution_name: training.institution_name,
          training_type: training.training_type,
          start_date: training.start_date,
          end_date: training.end_date,
          hours: training.hours,
          is_paid: training.is_paid,
          fee: training.fee,
          has_certificate: training.has_certificate
        }
      })

      // Apply training filter
      let filteredData = [...exportData]
      if (trainingFilter !== 'all') {
        filteredData = filteredData.filter(d => d.training_name === trainingFilter)
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filteredData = filteredData.filter(d => d.name.toLowerCase().includes(term))
      }

      if (filteredData.length === 0) {
        await modal.alert('다운로드할 데이터가 없습니다.', 'warning')
        setExporting(false)
        return
      }

      // Sort by rank and name
      filteredData = sortByRankAndName(filteredData)

      // Format data for Excel
      const excelData = filteredData.map(d => ({
        '성명': d.name,
        '직급': d.rank,
        '고유ID': d.email,
        '연수명': d.training_name,
        '기관': d.institution_name,
        '구분': d.training_type,
        '시작일': formatDate(d.start_date),
        '종료일': formatDate(d.end_date),
        '이수시간': Number(d.hours).toFixed(1),
        '연수비': d.is_paid ? `${Number(d.fee).toLocaleString()}원` : '무료',
        '이수증여부': d.has_certificate ? '등록' : '미등록'
      }))

      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '연수현황')

      // Set column widths
      worksheet['!cols'] = [
        { wch: 10 },  // 성명
        { wch: 8 },   // 직급
        { wch: 25 },  // 이메일
        { wch: 30 },  // 연수명
        { wch: 25 },  // 기관
        { wch: 8 },   // 구분
        { wch: 12 },  // 시작일
        { wch: 12 },  // 종료일
        { wch: 10 },  // 이수시간
        { wch: 12 },  // 연수비
        { wch: 10 }   // 이수증여부
      ]

      // Generate filename
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const dateStr = `${year}${month}${day}`

      const fileName = trainingFilter !== 'all'
        ? `${trainingFilter}_${dateStr}.xlsx`
        : `연수현황_${dateStr}.xlsx`

      // Download
      XLSX.writeFile(workbook, fileName)

      await modal.alert('엑셀 파일이 다운로드되었습니다.', 'success')
    } catch (error) {
      console.error('Export error:', error)
      await modal.alert('엑셀 다운로드에 실패했습니다.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handlePDFDownload = async () => {
    if (trainingFilter === 'all') {
      await modal.alert('특정 연수를 선택해주세요.', 'warning')
      return
    }

    try {
      setDownloadingPDF(true)

      const { PDFDocument } = await import('pdf-lib')

      // Use cached data for users and trainings (avoid 2 redundant API calls)
      const users = cachedUsersRef.current
      const trainings = cachedTrainingsRef.current

      // Only fetch certificates (not already cached)
      const certificatesResponse = await fetch('/api/admin/certificates')
      if (!certificatesResponse.ok) throw new Error('Failed to fetch certificates')
      const { certificates } = await certificatesResponse.json()

      // Filter trainings by selected training name
      const filteredTrainings = trainings.filter((t: Training) => t.training_name === trainingFilter)

      if (filteredTrainings.length === 0) {
        await modal.alert('해당 연수에 등록된 교사가 없습니다.', 'warning')
        setDownloadingPDF(false)
        return
      }

      // Get training IDs
      const trainingIds = filteredTrainings.map((t: any) => t.id)

      // Filter certificates by training IDs and check if they have certificates
      const filteredCertificates = certificates.filter((cert: any) =>
        trainingIds.includes(cert.training_id)
      )

      if (filteredCertificates.length === 0) {
        await modal.alert('해당 연수에 등록된 이수증이 없습니다.', 'warning')
        setDownloadingPDF(false)
        return
      }

      // Build lookup maps for O(1) joins
      const trainingMap = new Map(filteredTrainings.map((t: any) => [t.id, t]))
      const userMap = new Map(users.map(u => [u.id, u]))

      // Join with user data
      const certificatesWithUsers: CertificateWithUser[] = filteredCertificates.map((cert: any) => {
        const training = trainingMap.get(cert.training_id)
        const user = training ? userMap.get(training.user_id) : undefined
        return {
          ...cert,
          user_name: user?.name || '',
          user_rank: user?.rank || ''
        }
      })

      // Sort by rank and name
      certificatesWithUsers.sort((a: CertificateWithUser, b: CertificateWithUser) => {
        const rankA = RANK_ORDER[a.user_rank] || 999
        const rankB = RANK_ORDER[b.user_rank] || 999
        if (rankA !== rankB) return rankA - rankB
        return a.user_name.localeCompare(b.user_name, 'ko-KR')
      })

      // Download all certificate files using admin API
      console.log('Downloading certificate files via admin API...')
      const filePaths = certificatesWithUsers.map(cert => cert.file_path)

      const downloadResponse = await fetch('/api/admin/certificates/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePaths }),
      })

      if (!downloadResponse.ok) {
        throw new Error('Failed to download certificates from server')
      }

      const { results } = await downloadResponse.json()
      console.log(`Downloaded ${results.length} certificate files`)

      // Create merged PDF using pdf-lib
      const mergedPdf = await PDFDocument.create()

      let successCount = 0
      let failCount = 0

      // Process each certificate
      for (let i = 0; i < certificatesWithUsers.length; i++) {
        const cert = certificatesWithUsers[i]
        const downloadResult = results.find((r: any) => r.filePath === cert.file_path)

        if (!downloadResult || !downloadResult.success) {
          console.error(`Failed to download certificate for ${cert.user_name}:`, downloadResult?.error)
          failCount++
          continue
        }

        try {
          console.log(`Processing certificate ${i + 1}/${certificatesWithUsers.length} for ${cert.user_name}...`)

          const fileType = cert.file_type.toLowerCase()
          const base64Data = downloadResult.dataUrl

          // Check if it's a PDF file
          if (fileType.includes('pdf')) {
            console.log(`Processing PDF file for ${cert.user_name}`)

            // Extract base64 data (remove data URL prefix if present)
            const base64String = base64Data.includes(',')
              ? base64Data.split(',')[1]
              : base64Data

            // Convert base64 to Uint8Array
            const pdfBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))

            // Load the PDF
            const existingPdf = await PDFDocument.load(pdfBytes)

            // Copy all pages from the existing PDF
            const copiedPages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices())

            // Add each page to the merged PDF
            copiedPages.forEach(page => {
              mergedPdf.addPage(page)
            })

            successCount++
            console.log(`Successfully added PDF (${copiedPages.length} pages) for ${cert.user_name}`)
          } else if (fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg')) {
            console.log(`Processing image file for ${cert.user_name}`)

            // Load image to get dimensions
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image()
              image.onload = () => {
                console.log(`Image loaded: ${image.width}x${image.height}`)
                resolve(image)
              }
              image.onerror = (e) => {
                console.error('Image load error:', e)
                reject(new Error('Failed to load image'))
              }
              image.src = base64Data
            })

            // Extract base64 data (remove data URL prefix)
            const base64String = base64Data.split(',')[1]
            const imageBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))

            // Embed the image
            let embeddedImage
            if (fileType.includes('png')) {
              embeddedImage = await mergedPdf.embedPng(imageBytes)
            } else {
              embeddedImage = await mergedPdf.embedJpg(imageBytes)
            }

            // Create a new page (A4 size: 595 x 842 points)
            const page = mergedPdf.addPage([595, 842])

            // Calculate dimensions to fit the page
            const pageWidth = 595
            const pageHeight = 842
            const margin = 28.35 // 10mm in points

            let imgWidth = pageWidth - (margin * 2)
            let imgHeight = (embeddedImage.height * imgWidth) / embeddedImage.width

            // If image is too tall, scale by height instead
            if (imgHeight > pageHeight - (margin * 2)) {
              imgHeight = pageHeight - (margin * 2)
              imgWidth = (embeddedImage.width * imgHeight) / embeddedImage.height
            }

            // Center the image
            const x = (pageWidth - imgWidth) / 2
            const y = (pageHeight - imgHeight) / 2

            // Draw the image on the page
            page.drawImage(embeddedImage, {
              x: x,
              y: y,
              width: imgWidth,
              height: imgHeight,
            })

            successCount++
            console.log(`Successfully added image for ${cert.user_name}`)
          } else {
            console.warn(`Unsupported file type for ${cert.user_name}: ${fileType}`)
            failCount++
          }

        } catch (error) {
          console.error(`Error processing certificate for ${cert.user_name}:`, error)
          failCount++
          continue
        }
      }

      if (successCount === 0) {
        await modal.alert('PDF 생성에 실패했습니다. 이수증 파일을 다운로드할 수 없습니다.', 'error')
        setDownloadingPDF(false)
        return
      }

      // Save the merged PDF
      const pdfBytes = await mergedPdf.save()

      // Generate filename
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const dateStr = `${year}${month}${day}`
      const fileName = `${trainingFilter}_${dateStr}.pdf`

      // Download PDF
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)

      const message = failCount > 0
        ? `이수증 PDF 파일이 다운로드되었습니다.\n성공: ${successCount}개, 실패: ${failCount}개`
        : `이수증 PDF 파일이 다운로드되었습니다. (${successCount}개)`

      await modal.alert(message, failCount > 0 ? 'warning' : 'success')
    } catch (error) {
      console.error('PDF download error:', error)
      await modal.alert('PDF 다운로드에 실패했습니다.', 'error')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const handleYearlyReset = async () => {
    if (!resetPassword) {
      setResetError('비밀번호를 입력해주세요.')
      return
    }

    setResetting(true)
    setResetError('')

    try {
      const response = await fetch('/api/admin/reset-yearly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword })
      })

      const result = await response.json()

      if (!response.ok) {
        setResetError(result.error || '초기화에 실패했습니다.')
        setResetting(false)
        return
      }

      setShowResetModal(false)
      setResetPassword('')
      await modal.alert(
        `초기화가 완료되었습니다.\n삭제된 연수: ${result.deletedTrainings}건\n삭제된 파일: ${result.deletedFiles}개`,
        'success'
      )

      // Reload data
      loadTeacherData()
    } catch (error) {
      console.error('Reset error:', error)
      setResetError('초기화 중 오류가 발생했습니다.')
    } finally {
      setResetting(false)
    }
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

  if (loading) {
    if (isNavigating) return null
    return <PageLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 & 타이틀 */}
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">관리자</h1>
            </div>

            {/* 중앙 네비게이션 탭 */}
            <nav className="flex space-x-6">
              <Link
                href="/admin/dashboard"
                className="border-b-2 border-primary-600 py-5 px-2 text-sm font-medium text-primary-600 transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/admin/master-data"
                className="border-b-2 border-transparent py-5 px-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                마스터 데이터
              </Link>
              <Link
                href="/admin/users"
                className="border-b-2 border-transparent py-5 px-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                회원 관리
              </Link>
              <Link
                href="/admin/required-trainings"
                className="border-b-2 border-transparent py-5 px-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                필수연수관리
              </Link>
            </nav>

            {/* 우측 액션 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl border border-gray-200 hover:border-danger-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="로그아웃 (홈으로)"
              >
                {loggingOut ? (
                  <>
                    <ButtonSpinner className="h-5 w-5" />
                    <span>로그아웃 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>로그아웃</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">교사별 통계</h1>
          <p className="mt-2 text-gray-600">전체 교사의 연수 현황과 이수증 등록 상태를 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 전체 교사 이수 시간 달성률 */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white card-hover animate-stagger-in stagger-1">
            {/* 아이콘, 텍스트와 퍼센트 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {/* 아이콘 */}
                <div className="w-12 h-12 bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                {/* 텍스트 */}
                <div>
                  <p className="text-white text-lg font-semibold">전체 교사 이수 시간 달성률</p>
                  <p className="text-sm text-white/70 mt-1">목표: 60시간</p>
                </div>
              </div>
              {/* 퍼센트 */}
              <div className="text-5xl font-bold leading-none">
                {overallAchievementRate.toFixed(1)}%
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-white/25 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallAchievementRate, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 이수증 등록 달성률 */}
          <div className="bg-gradient-to-br from-success-500 to-success-600 rounded-xl shadow-lg p-6 text-white card-hover animate-stagger-in stagger-2">
            {/* 아이콘, 텍스트와 퍼센트 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                {/* 아이콘 */}
                <div className="w-12 h-12 bg-white/25 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {/* 텍스트 */}
                <div>
                  <p className="text-white text-lg font-semibold">이수증 등록 달성률</p>
                  <p className="text-sm text-white/70 mt-1">전체 연수 대비</p>
                </div>
              </div>
              {/* 퍼센트 */}
              <div className="text-5xl font-bold leading-none">
                {certificateCompletionRate.toFixed(1)}%
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-white/25 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(certificateCompletionRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 필터 & 검색 & 엑셀 다운로드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-stagger-in stagger-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">교사 검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름으로 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* 연수명 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">연수명 필터</label>
              <select
                value={trainingFilter}
                onChange={(e) => setTrainingFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                {uniqueTrainingNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 다운로드 버튼 */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 엑셀 다운로드 버튼 */}
              <button
                onClick={handleExcelDownload}
                disabled={exporting || filteredTeachers.length === 0}
                className="w-full px-6 py-3 bg-success-600 hover:bg-success-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>연수 데이터 엑셀 다운로드</span>
                  </>
                )}
              </button>

              {/* PDF 다운로드 버튼 */}
              <button
                onClick={handlePDFDownload}
                disabled={downloadingPDF || trainingFilter === 'all'}
                className="w-full px-6 py-3 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                title={trainingFilter === 'all' ? '특정 연수를 선택해주세요' : '이수증 PDF 일괄 다운로드'}
              >
                {downloadingPDF ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>이수증 PDF 일괄 다운로드</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <p>• 엑셀: 현재 필터링된 {filteredTeachers.length}명의 교사 연수 데이터 (직급순·이름순 정렬)</p>
              {trainingFilter !== 'all' && (
                <p>• PDF: "{trainingFilter}" 연수의 모든 이수증을 하나의 PDF로 병합 (직급순·이름순 정렬)</p>
              )}
            </div>
          </div>
        </div>

        {/* 교사 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-stagger-in stagger-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    성명
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    직급
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    총 시간/60
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    달성률
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    이수증 상태
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || trainingFilter !== 'all'
                        ? '검색 결과가 없습니다.'
                        : '등록된 교사가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                      {/* 성명 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 ${getRankColors(teacher.rank)}`}>
                            <span className="font-semibold text-sm">
                              {teacher.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-base font-medium text-gray-900">{teacher.name}</span>
                        </div>
                      </td>

                      {/* 직급 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                          {teacher.rank}
                        </span>
                      </td>

                      {/* 총 시간/60 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-semibold text-gray-900">
                          {teacher.totalHours.toFixed(1)}
                        </span>
                        <span className="text-base text-gray-500"> / 60시간</span>
                      </td>

                      {/* 달성률 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1.5">
                          <span className={`text-base font-bold ${getProgressTextColor(teacher.achievementRate)}`}>
                            {teacher.achievementRate.toFixed(0)}%
                          </span>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${getProgressColor(teacher.achievementRate)} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(teacher.achievementRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* 이수증 상태 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {teacher.totalTrainings === 0 ? (
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-600">
                            연수 없음
                          </span>
                        ) : teacher.hasCertificate ? (
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-success-100 text-success-700">
                            완료
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-warning-100 text-warning-700">
                            미등록 ({teacher.certificateCount}/{teacher.totalTrainings})
                          </span>
                        )}
                      </td>

                      {/* 상세 버튼 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/teacher/${teacher.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          상세보기
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 테이블 하단 요약 */}
          {filteredTeachers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{filteredTeachers.length}</span>명의 교사
                {trainingFilter !== 'all' && ` (${trainingFilter} 이수)`}
              </p>
            </div>
          )}
        </div>

        {/* 연간 데이터 초기화 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-danger-200 overflow-hidden animate-stagger-in stagger-5">
          <div className="px-5 py-4 flex items-center gap-4 bg-danger-50">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <svg className="w-5 h-5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-base font-semibold text-danger-800">연간 데이터 초기화</h3>
            </div>
            <p className="text-sm text-gray-700 flex-1 min-w-0">
              매년 2월, 새 학년도 시작 전 연수 데이터와 이수증을 초기화합니다. <span className="text-danger-600 font-medium">회원 계정, 마스터 데이터, 필수연수는 유지됩니다.</span>
            </p>
            <button
              onClick={() => {
                setShowResetModal(true)
                setResetPassword('')
                setResetError('')
              }}
              className="px-5 py-2 text-sm font-semibold text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors flex-shrink-0"
            >
              초기화 실행
            </button>
          </div>
        </div>

        {/* 초기화 확인 모달 */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">연간 데이터 초기화</h3>
                    <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
                  </div>
                </div>

                <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-sm text-danger-800 font-medium mb-2">다음 데이터가 영구 삭제됩니다:</p>
                  <ul className="text-sm text-danger-700 space-y-1 list-disc list-inside">
                    <li>모든 교사의 연수 등록 데이터</li>
                    <li>모든 이수증 파일</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">회원 계정, 마스터 데이터, 필수연수 링크는 유지됩니다.</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    관리자 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value)
                      setResetError('')
                    }}
                    placeholder="관리자 비밀번호를 입력하세요"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !resetting) {
                        handleYearlyReset()
                      }
                    }}
                    autoFocus
                  />
                  {resetError && (
                    <p className="mt-2 text-sm text-danger-600 font-medium">{resetError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowResetModal(false)
                      setResetPassword('')
                      setResetError('')
                    }}
                    disabled={resetting}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleYearlyReset}
                    disabled={resetting || !resetPassword}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-danger-600 rounded-lg hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {resetting ? (
                      <>
                        <ButtonSpinner className="mr-2 h-4 w-4 text-white" />
                        초기화 중...
                      </>
                    ) : (
                      '초기화 실행'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

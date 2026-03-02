'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PageLoadingSkeleton, ButtonSpinner } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useModal } from '@/components/CustomModal'

interface User {
  id: string
  email: string
  name: string
  rank: string
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

export default function UsersPage() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingRankUserId, setEditingRankUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const modal = useModal()

  const RANK_ORDER: { [key: string]: number } = {
    '교장': 1,
    '교감': 2,
    '부장': 3,
    '교사': 4,
    '교직원': 5
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')

      const { users: fetchedUsers } = await response.json() as { users: User[] }
      setUsers(fetchedUsers || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      modal.alert('사용자 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Memoize filtered + sorted users (replaces useEffect + separate state)
  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    return [...filtered].sort((a, b) => {
      const rankA = RANK_ORDER[a.rank] || 999
      const rankB = RANK_ORDER[b.rank] || 999
      if (rankA !== rankB) return rankA - rankB
      return a.name.localeCompare(b.name, 'ko-KR')
    })
  }, [users, searchTerm])

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await modal.confirm(`"${userName}" 사용자를 삭제하시겠습니까?\n\n연관된 모든 연수 데이터도 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`)
    if (!confirmed) return

    setDeletingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')

      // Update local state instead of full refetch
      setUsers(prev => prev.filter(u => u.id !== userId))
      await modal.alert('사용자가 삭제되었습니다.', 'success')
    } catch (error) {
      console.error('Delete user error:', error)
      await modal.alert('사용자 삭제에 실패했습니다.', 'error')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleResetPassword = async (userId: string, userName: string, userEmail: string) => {
    const confirmed = await modal.confirm(`"${userName}" 사용자의 비밀번호를 111111로 초기화하시겠습니까?\n\n사용자가 로그인 후 비밀번호를 변경하도록 안내해주세요.`)
    if (!confirmed) return

    setResettingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to reset password')

      await modal.alert(`"${userName}" 사용자의 비밀번호가 111111로 초기화되었습니다.`, 'success')
    } catch (error) {
      console.error('Reset password error:', error)
      await modal.alert('비밀번호 초기화에 실패했습니다.', 'error')
    } finally {
      setResettingUserId(null)
    }
  }

  const handleRankChange = async (userId: string, newRank: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rank: newRank })
      })

      if (!response.ok) throw new Error('Failed to update rank')

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, rank: newRank } : user
      ))
      setEditingRankUserId(null)
      await modal.alert('직급이 변경되었습니다.', 'success')
    } catch (error) {
      console.error('Update rank error:', error)
      await modal.alert('직급 변경에 실패했습니다.', 'error')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">관리자</h1>
            </div>

            {/* 중앙 네비게이션 탭 */}
            <nav className="flex space-x-6">
              <Link
                href="/admin/dashboard"
                className="border-b-2 border-transparent py-5 px-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
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
                className="border-b-2 border-primary-600 py-5 px-2 text-sm font-medium text-primary-600 transition-colors"
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
                onClick={() => {
                  localStorage.removeItem('admin_authenticated')
                  router.push('/')
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-xl border border-gray-200 hover:border-danger-200 transition-colors"
                title="로그아웃 (홈으로)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="mt-2 text-gray-600">전체 회원 목록과 계정 관리</p>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 또는 고유ID로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    고유ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    성명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    직급
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    가입일시
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      {/* 고유ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getRankColors(user.rank)}`}>
                            <span className="font-semibold text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-base text-gray-900">{user.email}</span>
                        </div>
                      </td>

                      {/* 성명 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-medium text-gray-900">{user.name}</span>
                      </td>

                      {/* 직급 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingRankUserId === user.id ? (
                          <select
                            value={user.rank}
                            onChange={(e) => handleRankChange(user.id, e.target.value)}
                            onBlur={() => setEditingRankUserId(null)}
                            autoFocus
                            className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 text-primary-800 border-2 border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="교장">교장</option>
                            <option value="교감">교감</option>
                            <option value="부장">부장</option>
                            <option value="교사">교사</option>
                            <option value="교직원">교직원</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingRankUserId(user.id)}
                            className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                            title="클릭하여 직급 변경"
                          >
                            {user.rank}
                          </button>
                        )}
                      </td>

                      {/* 가입일시 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base text-gray-600">{formatDate(user.created_at)}</span>
                      </td>

                      {/* 관리 버튼 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setNavigatingTo(`detail-${user.id}`)
                              router.push(`/admin/teacher/${user.id}`)
                            }}
                            disabled={navigatingTo === `detail-${user.id}`}
                            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            title="상세보기"
                          >
                            {navigatingTo === `detail-${user.id}` ? (
                              <>
                                <ButtonSpinner className="mr-1 h-4 w-4" />
                                이동 중
                              </>
                            ) : (
                              '상세'
                            )}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id, user.name, user.email)}
                            disabled={resettingUserId === user.id}
                            className="px-3 py-1.5 text-sm font-medium text-warning-600 hover:text-warning-700 hover:bg-warning-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="비밀번호 초기화 (111111)"
                          >
                            {resettingUserId === user.id ? (
                              <span className="flex items-center">
                                <ButtonSpinner className="mr-1 h-4 w-4" />
                                처리중
                              </span>
                            ) : '초기화'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={deletingUserId === user.id}
                            className="px-3 py-1.5 text-sm font-medium text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="삭제"
                          >
                            {deletingUserId === user.id ? (
                              <span className="flex items-center">
                                <ButtonSpinner className="mr-1 h-4 w-4" />
                                삭제중
                              </span>
                            ) : '삭제'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 테이블 하단 요약 */}
          {filteredUsers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-base text-gray-600">
                {searchTerm ? (
                  <>
                    검색 결과 <span className="font-semibold text-gray-900">{filteredUsers.length}</span>명
                    (전체 {users.length}명)
                  </>
                ) : (
                  <>
                    총 <span className="font-semibold text-gray-900">{users.length}</span>명의 회원
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

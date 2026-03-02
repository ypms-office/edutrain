'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner, ButtonSpinner } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useModal } from '@/components/CustomModal'

interface RequiredTraining {
  id: string
  name: string
  url: string
  display_order: number
  is_active: boolean
  created_at: string
}

export default function RequiredTrainingsPage() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const [trainings, setTrainings] = useState<RequiredTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingUrl, setEditingUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const modal = useModal()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('required_trainings')
        .select('*')
        .order('display_order')

      if (error) throw error
      setTrainings(data || [])
    } catch (error) {
      console.error('Failed to load required trainings:', error)
      modal.alert('필수 연수 데이터를 불러오는데 실패했습니다.\nSupabase에서 required_trainings 테이블이 생성되었는지 확인하세요.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) {
      await modal.alert('연수명을 입력하세요.', 'warning')
      return
    }
    if (!newUrl.trim()) {
      await modal.alert('링크 주소를 입력하세요.', 'warning')
      return
    }

    setAdding(true)
    try {
      const supabase = createClient()
      const maxOrder = trainings.length > 0 ? Math.max(...trainings.map(t => t.display_order)) : 0

      const { data, error } = await supabase
        .from('required_trainings')
        .insert({
          name: newName.trim(),
          url: newUrl.trim(),
          display_order: maxOrder + 1,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setTrainings(prev => [...prev, data])
      }

      setNewName('')
      setNewUrl('')
      await modal.alert('추가되었습니다.', 'success')
    } catch (error) {
      console.error('Add error:', error)
      await modal.alert('추가에 실패했습니다.', 'error')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (item: RequiredTraining) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setEditingUrl(item.url)
  }

  const saveEdit = async () => {
    if (!editingId || !editingName.trim() || !editingUrl.trim()) return

    setSavingEdit(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('required_trainings')
        .update({ name: editingName.trim(), url: editingUrl.trim() })
        .eq('id', editingId)

      if (error) throw error

      setTrainings(prev => prev.map(item =>
        item.id === editingId
          ? { ...item, name: editingName.trim(), url: editingUrl.trim() }
          : item
      ))

      setEditingId(null)
      setEditingName('')
      setEditingUrl('')
      await modal.alert('수정되었습니다.', 'success')
    } catch (error) {
      console.error('Update error:', error)
      await modal.alert('수정에 실패했습니다.', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingUrl('')
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await modal.confirm(`"${name}"을(를) 삭제하시겠습니까?`)
    if (!confirmed) return

    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('required_trainings')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTrainings(prev => prev.filter(item => item.id !== id))
      await modal.alert('삭제되었습니다.', 'success')
    } catch (error) {
      console.error('Delete error:', error)
      await modal.alert('삭제에 실패했습니다.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    setTogglingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('required_trainings')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error

      setTrainings(prev => prev.map(item =>
        item.id === id ? { ...item, is_active: !currentState } : item
      ))
    } catch (error) {
      console.error('Toggle active error:', error)
      modal.alert('상태 변경에 실패했습니다.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = trainings.findIndex(item => item.id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= trainings.length) return

    const currentItem = trainings[currentIndex]
    const targetItem = trainings[targetIndex]

    const newItems = [...trainings]
    newItems[currentIndex] = { ...currentItem, display_order: targetItem.display_order }
    newItems[targetIndex] = { ...targetItem, display_order: currentItem.display_order }
    newItems.sort((a, b) => a.display_order - b.display_order)
    setTrainings(newItems)

    try {
      const supabase = createClient()
      const [result1, result2] = await Promise.all([
        supabase.from('required_trainings').update({ display_order: targetItem.display_order }).eq('id', currentItem.id),
        supabase.from('required_trainings').update({ display_order: currentItem.display_order }).eq('id', targetItem.id)
      ])

      if (result1.error) throw result1.error
      if (result2.error) throw result2.error
    } catch (error) {
      console.error('Move item error:', error)
      setTrainings(trainings)
      modal.alert('순서 변경에 실패했습니다.', 'error')
    }
  }

  if (loading) {
    if (isNavigating) return null
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto" />
          <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">관리자</h1>
            </div>

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
                className="border-b-2 border-transparent py-5 px-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
              >
                회원 관리
              </Link>
              <Link
                href="/admin/required-trainings"
                className="border-b-2 border-primary-600 py-5 px-2 text-sm font-medium text-primary-600 transition-colors"
              >
                필수연수관리
              </Link>
            </nav>

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
          <h1 className="text-3xl font-bold text-gray-900">필수 연수 관리</h1>
          <p className="mt-2 text-gray-600">교사들이 필수적으로 이수해야 하는 연수 목록과 링크를 관리하세요</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-stagger-in stagger-1">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">필수 연수 목록</h3>
          </div>

          <div className="p-6">
            {/* 추가 폼 */}
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="연수명 입력..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="링크 주소 입력 (https://...)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? (
                      <span className="flex items-center">
                        <ButtonSpinner className="mr-1 h-4 w-4" />
                        추가중
                      </span>
                    ) : '추가'}
                  </button>
                </div>
              </div>
            </div>

            {/* 목록 */}
            {trainings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 필수 연수가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {trainings.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                      item.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* 순서 변경 */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveItem(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="위로"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveItem(item.id, 'down')}
                          disabled={index === trainings.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="아래로"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-sm font-medium text-gray-500 w-8">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* 이름 & URL (수정 모드) */}
                      {editingId === item.id ? (
                        <div className="flex-1 space-y-2 min-w-0">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-3 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="연수명"
                            autoFocus
                          />
                          <input
                            type="url"
                            value={editingUrl}
                            onChange={(e) => setEditingUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="w-full px-3 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="링크 주소"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className={`block font-medium ${item.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {item.name}
                          </span>
                          <span className="block text-sm text-gray-400 truncate">
                            {item.url}
                          </span>
                        </div>
                      )}

                      {!item.is_active && (
                        <span className="px-2 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-600">
                          비활성
                        </span>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-2 ml-4">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            disabled={savingEdit}
                            className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors disabled:opacity-50"
                            title="저장"
                          >
                            {savingEdit ? (
                              <ButtonSpinner className="h-5 w-5" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="취소"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleActive(item.id, item.is_active)}
                            disabled={togglingId === item.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              item.is_active
                                ? 'text-warning-600 hover:bg-warning-50'
                                : 'text-success-600 hover:bg-success-50'
                            }`}
                            title={item.is_active ? '비활성화' : '활성화'}
                          >
                            {togglingId === item.id ? (
                              <ButtonSpinner className="h-5 w-5" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {item.is_active ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                )}
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={deletingId === item.id}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            {deletingId === item.id ? (
                              <ButtonSpinner className="h-5 w-5" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

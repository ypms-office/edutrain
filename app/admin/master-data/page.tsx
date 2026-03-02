'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner, ButtonSpinner } from '@/components/LoadingIndicators'
import { useIsNavigating } from '@/components/NavigationLoadingContext'
import { useModal } from '@/components/CustomModal'

interface MasterItem {
  id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
}

type MasterType = 'training' | 'institution'

export default function MasterDataPage() {
  const router = useRouter()
  const isNavigating = useIsNavigating()
  const [trainingNames, setTrainingNames] = useState<MasterItem[]>([])
  const [institutions, setInstitutions] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(true)

  // 추가 모드
  const [newTrainingName, setNewTrainingName] = useState('')
  const [newInstitutionName, setNewInstitutionName] = useState('')

  // 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingType, setEditingType] = useState<MasterType | null>(null)

  // 작업 중 상태
  const [addingType, setAddingType] = useState<MasterType | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const modal = useModal()

  useEffect(() => {
    loadMasterData()
  }, [])

  const loadMasterData = async () => {
    try {
      const supabase = createClient()

      // Fetch both in parallel
      const [trainingResult, institutionResult] = await Promise.all([
        supabase
          .from('master_training_names')
          .select('id, name, display_order, is_active, created_at')
          .order('display_order'),
        supabase
          .from('master_institutions')
          .select('id, name, display_order, is_active, created_at')
          .order('display_order')
      ])

      if (trainingResult.error) throw trainingResult.error
      if (institutionResult.error) throw institutionResult.error

      setTrainingNames(trainingResult.data || [])
      setInstitutions(institutionResult.data || [])
    } catch (error) {
      console.error('Failed to load master data:', error)
      modal.alert('마스터 데이터를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Helper to update the correct state list
  const getSetterAndItems = (type: MasterType) => {
    return type === 'training'
      ? { items: trainingNames, setter: setTrainingNames }
      : { items: institutions, setter: setInstitutions }
  }

  // 추가
  const handleAdd = async (type: MasterType) => {
    const name = type === 'training' ? newTrainingName : newInstitutionName
    if (!name.trim()) {
      await modal.alert('이름을 입력하세요.', 'warning')
      return
    }

    setAddingType(type)
    try {
      const supabase = createClient()
      const table = type === 'training' ? 'master_training_names' : 'master_institutions'
      const { items, setter } = getSetterAndItems(type)
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0

      const { data, error } = await supabase
        .from(table)
        .insert({
          name: name.trim(),
          display_order: maxOrder + 1,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      // Update local state instead of full refetch
      if (data) {
        setter(prev => [...prev, data])
      }

      if (type === 'training') {
        setNewTrainingName('')
      } else {
        setNewInstitutionName('')
      }

      await modal.alert('추가되었습니다.', 'success')
    } catch (error) {
      console.error('Add error:', error)
      await modal.alert('추가에 실패했습니다.', 'error')
    } finally {
      setAddingType(null)
    }
  }

  // 수정 시작
  const startEdit = (id: string, name: string, type: MasterType) => {
    setEditingId(id)
    setEditingName(name)
    setEditingType(type)
  }

  // 수정 저장
  const saveEdit = async () => {
    if (!editingId || !editingType || !editingName.trim()) return

    setSavingEdit(true)
    try {
      const supabase = createClient()
      const table = editingType === 'training' ? 'master_training_names' : 'master_institutions'

      const { error } = await supabase
        .from(table)
        .update({ name: editingName.trim() })
        .eq('id', editingId)

      if (error) throw error

      // Update local state instead of full refetch
      const { setter } = getSetterAndItems(editingType)
      setter(prev => prev.map(item =>
        item.id === editingId ? { ...item, name: editingName.trim() } : item
      ))

      setEditingId(null)
      setEditingName('')
      setEditingType(null)
      await modal.alert('수정되었습니다.', 'success')
    } catch (error) {
      console.error('Update error:', error)
      await modal.alert('수정에 실패했습니다.', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingType(null)
  }

  // 삭제
  const handleDelete = async (id: string, type: MasterType, name: string) => {
    const confirmed = await modal.confirm(`"${name}"을(를) 삭제하시겠습니까?`)
    if (!confirmed) return

    setDeletingId(id)
    try {
      const supabase = createClient()
      const table = type === 'training' ? 'master_training_names' : 'master_institutions'

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state instead of full refetch
      const { setter } = getSetterAndItems(type)
      setter(prev => prev.filter(item => item.id !== id))
      await modal.alert('삭제되었습니다.', 'success')
    } catch (error) {
      console.error('Delete error:', error)
      await modal.alert('삭제에 실패했습니다.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // 활성/비활성 토글
  const toggleActive = async (id: string, type: MasterType, currentState: boolean) => {
    setTogglingId(id)
    try {
      const supabase = createClient()
      const table = type === 'training' ? 'master_training_names' : 'master_institutions'

      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error

      // Update local state instead of full refetch
      const { setter } = getSetterAndItems(type)
      setter(prev => prev.map(item =>
        item.id === id ? { ...item, is_active: !currentState } : item
      ))
    } catch (error) {
      console.error('Toggle active error:', error)
      modal.alert('상태 변경에 실패했습니다.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  // 순서 변경
  const moveItem = async (id: string, type: MasterType, direction: 'up' | 'down') => {
    const { items, setter } = getSetterAndItems(type)

    const currentIndex = items.findIndex(item => item.id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const currentItem = items[currentIndex]
    const targetItem = items[targetIndex]

    // Optimistic UI update first (swap in local state immediately)
    const newItems = [...items]
    newItems[currentIndex] = { ...currentItem, display_order: targetItem.display_order }
    newItems[targetIndex] = { ...targetItem, display_order: currentItem.display_order }
    newItems.sort((a, b) => a.display_order - b.display_order)
    setter(newItems)

    try {
      const supabase = createClient()
      const table = type === 'training' ? 'master_training_names' : 'master_institutions'

      // Execute both updates in parallel
      const [result1, result2] = await Promise.all([
        supabase.from(table).update({ display_order: targetItem.display_order }).eq('id', currentItem.id),
        supabase.from(table).update({ display_order: currentItem.display_order }).eq('id', targetItem.id)
      ])

      if (result1.error) throw result1.error
      if (result2.error) throw result2.error
    } catch (error) {
      console.error('Move item error:', error)
      // Revert on error
      setter(items)
      modal.alert('순서 변경에 실패했습니다.', 'error')
    }
  }

  const renderMasterSection = (
    title: string,
    items: MasterItem[],
    type: MasterType,
    newValue: string,
    setNewValue: (value: string) => void
  ) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="p-6">
        {/* 추가 폼 */}
        <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd(type)}
              placeholder="새 항목 입력..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={() => handleAdd(type)}
              disabled={addingType === type}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingType === type ? (
                <span className="flex items-center">
                  <ButtonSpinner className="mr-1 h-4 w-4" />
                  추가중
                </span>
              ) : '추가'}
            </button>
          </div>
        </div>

        {/* 목록 */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                  item.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* 순서 번호 */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => moveItem(item.id, type, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="위로"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveItem(item.id, type, 'down')}
                      disabled={index === items.length - 1}
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

                  {/* 이름 (수정 모드) */}
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                      className="flex-1 px-3 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  ) : (
                    <span className={`flex-1 font-medium ${item.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.name}
                    </span>
                  )}

                  {/* 활성/비활성 배지 */}
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
                        onClick={() => toggleActive(item.id, type, item.is_active)}
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
                        onClick={() => startEdit(item.id, item.name, type)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, type, item.name)}
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
  )

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
            {/* 로고 & 타이틀 */}
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
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
                className="border-b-2 border-primary-600 py-5 px-2 text-sm font-medium text-primary-600 transition-colors"
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
          <h1 className="text-3xl font-bold text-gray-900">마스터 데이터 관리</h1>
          <p className="mt-2 text-gray-600">연수명과 기관명을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 연수명 관리 */}
          {renderMasterSection(
            '연수명 관리',
            trainingNames,
            'training',
            newTrainingName,
            setNewTrainingName
          )}

          {/* 기관명 관리 */}
          {renderMasterSection(
            '기관명 관리',
            institutions,
            'institution',
            newInstitutionName,
            setNewInstitutionName
          )}
        </div>
      </main>
    </div>
  )
}

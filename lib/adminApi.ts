/**
 * 관리자 화면(브라우저)에서 쓰는 API 호출 모음.
 * 실제 권한 검사는 서버의 /api/admin/* 라우트가 쿠키로 한다.
 */

export type LookupTable = 'master_training_names' | 'master_institutions' | 'required_trainings'

async function callLookup(table: LookupTable, method: 'POST' | 'PATCH' | 'DELETE', body: object) {
  const response = await fetch(`/api/admin/lookup/${table}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))

  if (response.status === 401) {
    // 세션 만료 — 다시 로그인하도록 보낸다
    localStorage.removeItem('admin_authenticated')
    window.location.href = '/admin'
  }
  if (!response.ok) {
    throw new Error(result.error || '요청에 실패했습니다.')
  }
  return result.data
}

export const adminLookup = {
  insert: (table: LookupTable, values: object) => callLookup(table, 'POST', values),
  update: (table: LookupTable, id: string, values: object) => callLookup(table, 'PATCH', { id, ...values }),
  remove: (table: LookupTable, id: string) => callLookup(table, 'DELETE', { id }),
}

export async function adminLogout() {
  localStorage.removeItem('admin_authenticated')
  await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
}

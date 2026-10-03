import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/adminAuth'

/**
 * 관리자 화면의 목록 데이터(연수명·기관명·필수 연수) 추가/수정/삭제.
 * 이 테이블들은 RLS로 읽기만 공개되어 있으므로, 쓰기는 반드시 이 라우트를 거친다.
 */
const EDITABLE_COLUMNS: Record<string, string[]> = {
  master_training_names: ['name', 'display_order', 'is_active'],
  master_institutions: ['name', 'display_order', 'is_active'],
  required_trainings: ['name', 'url', 'display_order', 'is_active'],
}

type Params = { params: Promise<{ table: string }> }

function pickColumns(table: string, body: Record<string, unknown>) {
  const values: Record<string, unknown> = {}
  for (const column of EDITABLE_COLUMNS[table]) {
    if (body[column] !== undefined) values[column] = body[column]
  }
  return values
}

async function resolveTable(params: Params['params']) {
  const { table } = await params
  return EDITABLE_COLUMNS[table] ? table : null
}

const unknownTable = () =>
  NextResponse.json({ error: 'Unknown table' }, { status: 404 })

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const table = await resolveTable(params)
  if (!table) return unknownTable()

  try {
    const values = pickColumns(table, await request.json())
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from(table)
      .insert(values)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error(`Insert into ${table} failed:`, error)
    return NextResponse.json({ error: '추가에 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const table = await resolveTable(params)
  if (!table) return unknownTable()

  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from(table)
      .update(pickColumns(table, body))
      .eq('id', body.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Update ${table} failed:`, error)
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized

  const table = await resolveTable(params)
  if (!table) return unknownTable()

  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Delete from ${table} failed:`, error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }
}

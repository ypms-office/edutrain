import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_COOKIE, adminCookieOptions, createAdminToken, safeEqual } from '@/lib/adminAuth'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('admin_config')
      .select('config_value')
      .eq('config_key', 'admin_password')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '관리자 설정을 불러올 수 없습니다.' },
        { status: 500 }
      )
    }

    if (!safeEqual(password, data.config_value)) {
      // 무작위 대입을 늦추기 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800))
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions)
    return response
  } catch (error) {
    console.error('Admin login failed:', error)
    return NextResponse.json(
      { error: '인증에 실패했습니다.' },
      { status: 500 }
    )
  }
}

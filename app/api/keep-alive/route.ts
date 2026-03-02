import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Vercel Cron Job 인증 검증
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: '인증되지 않은 요청입니다.' },
      { status: 401 }
    )
  }

  try {
    const supabase = createAdminClient()

    // 간단한 쿼리로 DB 활성 상태 유지
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase keep-alive 성공',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keep-alive 실패:', error)
    return NextResponse.json(
      { error: 'Keep-alive 쿼리 실패' },
      { status: 500 }
    )
  }
}

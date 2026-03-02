import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { nameToEmail } from '@/lib/authHelpers'

export async function POST(request: Request) {
  try {
    const { name, currentPassword, newPassword } = await request.json()

    // Validate input
    if (!name || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '이름, 기존 비밀번호, 새 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // Validate password format (alphanumeric, 6-20 characters)
    if (!/^[A-Za-z\d]{6,20}$/.test(newPassword)) {
      return NextResponse.json(
        { error: '비밀번호는 영문 혹은 숫자로 6-20자여야 합니다.' },
        { status: 400 }
      )
    }

    const internalEmail = nameToEmail(name)

    // First, verify current password by attempting to sign in
    const supabaseClient = await createClient()
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: internalEmail,
      password: currentPassword,
    })

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { error: '이름 또는 기존 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // Current password is correct, now update to new password using admin client
    const supabaseAdmin = createAdminClient()
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      signInData.user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: '비밀번호 변경에 실패했습니다.' },
        { status: 500 }
      )
    }

    // Sign out the user since we verified with sign in
    await supabaseClient.auth.signOut()

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

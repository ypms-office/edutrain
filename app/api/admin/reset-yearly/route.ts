import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Verify admin password
    const { data: configData, error: configError } = await supabase
      .from('admin_config')
      .select('config_value')
      .eq('config_key', 'admin_password')
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: '관리자 설정을 확인할 수 없습니다.' },
        { status: 500 }
      )
    }

    if (configData.config_value !== password) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 403 }
      )
    }

    // 1. Get all users to delete their storage files
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')

    if (usersError) throw usersError

    // 2. Delete all certificate files from storage
    let deletedFilesCount = 0
    for (const user of (users || [])) {
      try {
        const { data: folders } = await supabase.storage
          .from('certificates')
          .list(user.id, { limit: 1000 })

        if (folders && folders.length > 0) {
          const filePaths: string[] = []

          for (const folder of folders) {
            if (folder.name) {
              const { data: subFiles } = await supabase.storage
                .from('certificates')
                .list(`${user.id}/${folder.name}`, { limit: 100 })

              if (subFiles) {
                subFiles.forEach(file => {
                  if (file.name) {
                    filePaths.push(`${user.id}/${folder.name}/${file.name}`)
                  }
                })
              }
            }
          }

          if (filePaths.length > 0) {
            await supabase.storage
              .from('certificates')
              .remove(filePaths)
            deletedFilesCount += filePaths.length
          }
        }
      } catch (storageError) {
        console.warn(`Storage cleanup failed for user ${user.id}:`, storageError)
      }
    }

    // 3. Delete all certificates records (will be cascade-deleted with trainings, but explicit for clarity)
    const { error: certDeleteError } = await supabase
      .from('certificates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows

    if (certDeleteError) {
      console.warn('Certificate records deletion error:', certDeleteError)
    }

    // 4. Delete all trainings records
    const { data: deletedTrainings, error: trainingDeleteError } = await supabase
      .from('trainings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // delete all rows
      .select('id')

    if (trainingDeleteError) throw trainingDeleteError

    const deletedTrainingsCount = deletedTrainings?.length || 0

    console.log(`Yearly reset completed: ${deletedTrainingsCount} trainings, ${deletedFilesCount} files deleted`)

    return NextResponse.json({
      success: true,
      deletedTrainings: deletedTrainingsCount,
      deletedFiles: deletedFilesCount
    })
  } catch (error) {
    console.error('Yearly reset failed:', error)
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

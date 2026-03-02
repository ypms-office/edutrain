import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id: userId } = await params
    const body = await request.json()
    const { rank } = body

    if (!rank) {
      return NextResponse.json(
        { error: 'Rank is required' },
        { status: 400 }
      )
    }

    // Validate rank
    const validRanks = ['교장', '교감', '부장', '교사', '교직원']
    if (!validRanks.includes(rank)) {
      return NextResponse.json(
        { error: 'Invalid rank value' },
        { status: 400 }
      )
    }

    // Update user rank
    const { error: updateError } = await supabase
      .from('users')
      .update({ rank })
      .eq('id', userId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update user rank:', error)
    return NextResponse.json(
      { error: 'Failed to update user rank' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id: userId } = await params

    // Delete certificate files from storage before deleting user
    try {
      // List all files in user's folder
      const { data: files, error: listError } = await supabase.storage
        .from('certificates')
        .list(userId, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (listError) {
        console.warn('Failed to list certificate files:', listError)
      } else if (files && files.length > 0) {
        // Get all file paths under user's folder (including subfolders)
        const filePaths: string[] = []

        // For each subfolder (training_id), list files
        for (const item of files) {
          if (item.name) {
            const { data: subFiles, error: subListError } = await supabase.storage
              .from('certificates')
              .list(`${userId}/${item.name}`, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' }
              })

            if (!subListError && subFiles) {
              subFiles.forEach(file => {
                if (file.name) {
                  filePaths.push(`${userId}/${item.name}/${file.name}`)
                }
              })
            }
          }
        }

        // Delete all files
        if (filePaths.length > 0) {
          const { error: removeError } = await supabase.storage
            .from('certificates')
            .remove(filePaths)

          if (removeError) {
            console.warn('Failed to delete certificate files:', removeError)
          } else {
            console.log(`Deleted ${filePaths.length} certificate files for user ${userId}`)
          }
        }
      }
    } catch (storageError) {
      console.warn('Storage deletion error:', storageError)
      // Continue with user deletion even if storage cleanup fails
    }

    // Delete user from database (CASCADE will delete trainings)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    // Try to delete from Supabase Auth (may fail if user doesn't exist in auth)
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('Failed to delete user from auth:', authError)
      }
    } catch (authError) {
      console.warn('Auth deletion error:', authError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

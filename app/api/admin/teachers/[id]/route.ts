import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id: userId } = await params

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Fetch trainings for this user
    const { data: trainings, error: trainingsError } = await supabase
      .from('trainings')
      .select('*')
      .eq('user_id', userId)
      .order('end_date', { ascending: false })

    if (trainingsError) throw trainingsError

    return NextResponse.json({ user, trainings })
  } catch (error) {
    console.error('Failed to fetch teacher data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher data' },
      { status: 500 }
    )
  }
}

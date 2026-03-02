import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: trainings, error } = await supabase
      .from('trainings')
      .select('id, user_id, training_name, institution_name, training_type, start_date, end_date, hours, is_paid, fee, has_certificate')
      .order('end_date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ trainings })
  } catch (error) {
    console.error('Failed to fetch trainings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}

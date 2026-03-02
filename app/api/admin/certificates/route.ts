import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all certificates with training information
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('id, training_id, file_name, file_path, file_size, file_type, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch certificates error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ certificates })
  } catch (error) {
    console.error('Get certificates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

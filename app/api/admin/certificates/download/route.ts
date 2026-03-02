import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { filePaths } = await request.json()

    if (!filePaths || !Array.isArray(filePaths)) {
      return NextResponse.json(
        { error: 'File paths array is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const results = []

    // Download each file
    for (const filePath of filePaths) {
      try {
        const { data, error } = await supabase.storage
          .from('certificates')
          .download(filePath)

        if (error || !data) {
          console.error(`Failed to download ${filePath}:`, error)
          results.push({
            filePath,
            success: false,
            error: error?.message || 'Download failed'
          })
          continue
        }

        // Convert blob to base64
        const arrayBuffer = await data.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = data.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        results.push({
          filePath,
          success: true,
          dataUrl,
          size: data.size
        })

      } catch (err: any) {
        console.error(`Error processing ${filePath}:`, err)
        results.push({
          filePath,
          success: false,
          error: err.message
        })
      }
    }

    return NextResponse.json({ results })

  } catch (error: any) {
    console.error('Download certificates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

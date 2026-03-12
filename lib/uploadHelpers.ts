import { createClient } from '@/lib/supabase/client'

// File validation constants
export const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

// Validation functions
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type)
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : ''
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!validateFileSize(file)) {
    return { valid: false, error: '파일 크기는 1MB를 초과할 수 없습니다.' }
  }

  const extension = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'PDF, JPG, PNG 파일만 업로드 가능합니다.' }
  }

  // If MIME type is empty or not detected, rely on extension only
  if (!file.type || file.type === '') {
    console.log('MIME type not detected, relying on file extension:', extension)
    return { valid: true }
  }

  // If extension is valid, check MIME type but be more lenient
  // Some systems report different MIME types for the same extension
  if (!validateFileType(file)) {
    // For image files, accept if extension is valid even if MIME type doesn't match perfectly
    const imageExtensions = ['.jpg', '.jpeg', '.png']
    const isImageFile = imageExtensions.includes(extension)
    const hasImageMimeType = file.type.startsWith('image/')

    if (isImageFile && hasImageMimeType) {
      // Extension is valid and it's some kind of image, allow it
      return { valid: true }
    }

    // For PDF, be more strict
    if (extension === '.pdf' && file.type !== 'application/pdf') {
      return { valid: false, error: '지원하지 않는 파일 형식입니다.' }
    }

    // If we get here and MIME type still doesn't match, reject
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' }
  }

  return { valid: true }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Maximum number of certificate files per training
export const MAX_CERTIFICATES_PER_TRAINING = 2

// Upload certificate to Supabase Storage
export async function uploadCertificate(
  file: File,
  userId: string,
  trainingId: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const supabase = createClient()

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Check how many certificates already exist for this training
    const { data: existingCerts, error: countError } = await supabase
      .from('certificates')
      .select('id')
      .eq('training_id', trainingId)

    if (countError) {
      console.error('Count error:', countError)
      return { success: false, error: '이수증 개수 확인 중 오류가 발생했습니다.' }
    }

    if (existingCerts && existingCerts.length >= MAX_CERTIFICATES_PER_TRAINING) {
      return { success: false, error: `이수증은 최대 ${MAX_CERTIFICATES_PER_TRAINING}개까지 등록할 수 있습니다.` }
    }

    // Generate file path: {user_id}/{training_id}/{filename}
    const fileExtension = getFileExtension(file.name)
    const timestamp = Date.now()
    const fileName = `certificate_${timestamp}${fileExtension}`
    const filePath = `${userId}/${trainingId}/${fileName}`

    // Determine correct content type based on extension
    let contentType = file.type
    if (!contentType || contentType === '') {
      // If MIME type is not detected, set it based on extension
      if (fileExtension === '.pdf') {
        contentType = 'application/pdf'
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg'
      } else if (fileExtension === '.png') {
        contentType = 'image/png'
      }
    }

    // Upload to Supabase Storage with explicit contentType
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: '파일 업로드 중 오류가 발생했습니다.' }
    }

    // Save metadata to certificates table
    const { error: dbError } = await supabase
      .from('certificates')
      .insert({
        training_id: trainingId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })

    if (dbError) {
      // If database save fails, delete the uploaded file
      await supabase.storage.from('certificates').remove([filePath])
      console.error('Database error:', dbError)
      return { success: false, error: '이수증 정보 저장 중 오류가 발생했습니다.' }
    }

    // Update trainings.has_certificate to true
    const { error: updateError } = await supabase
      .from('trainings')
      .update({ has_certificate: true })
      .eq('id', trainingId)

    if (updateError) {
      console.error('Update error:', updateError)
      // Don't fail the operation if this update fails
    }

    return { success: true, filePath }
  } catch (error) {
    console.error('Upload certificate error:', error)
    return { success: false, error: '알 수 없는 오류가 발생했습니다.' }
  }
}

// Delete certificate from Storage
export async function deleteCertificate(
  filePath: string,
  trainingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('certificates')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return { success: false, error: '파일 삭제 중 오류가 발생했습니다.' }
    }

    // Delete from certificates table by file_path (specific file)
    const { error: dbError } = await supabase
      .from('certificates')
      .delete()
      .eq('file_path', filePath)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { success: false, error: '이수증 정보 삭제 중 오류가 발생했습니다.' }
    }

    // Check if any certificates remain for this training
    const { data: remaining, error: checkError } = await supabase
      .from('certificates')
      .select('id')
      .eq('training_id', trainingId)

    if (checkError) {
      console.error('Check remaining error:', checkError)
    }

    // Update has_certificate based on remaining certificates
    const hasCertificates = remaining && remaining.length > 0
    const { error: updateError } = await supabase
      .from('trainings')
      .update({ has_certificate: hasCertificates })
      .eq('id', trainingId)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return { success: true }
  } catch (error) {
    console.error('Delete certificate error:', error)
    return { success: false, error: '알 수 없는 오류가 발생했습니다.' }
  }
}

// Download certificate
export async function downloadCertificate(
  filePath: string,
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Get public URL for download
    const { data } = await supabase.storage
      .from('certificates')
      .download(filePath)

    if (!data) {
      return { success: false, error: '파일을 찾을 수 없습니다.' }
    }

    // Create blob URL and trigger download
    const url = window.URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Download certificate error:', error)
    return { success: false, error: '파일 다운로드 중 오류가 발생했습니다.' }
  }
}

// Get certificate preview URL
export async function getCertificatePreviewUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath)

    if (!data || !data.publicUrl) {
      return { error: '미리보기 URL을 가져올 수 없습니다.' }
    }

    return { url: data.publicUrl }
  } catch (error) {
    console.error('Get preview URL error:', error)
    return { error: '미리보기 URL을 가져오는 중 오류가 발생했습니다.' }
  }
}

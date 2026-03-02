-- ============================================
-- 교사 연수 관리 시스템 - Supabase Storage Policies
-- ============================================

-- Storage 버킷은 Supabase 웹 UI에서 수동으로 생성
-- 버킷명: certificates
-- Public: OFF (Private)
-- File size limit: 1MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png

-- Storage RLS 정책 생성

-- 정책 1: Users can upload own certificates
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 정책 2: Users can view own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 정책 3: Users can delete own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

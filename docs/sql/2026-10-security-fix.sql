-- ============================================
-- 보안 패치 (2026-10) — Supabase Security Advisor 오류 4건 · 경고 2건 해결
--
-- ⚠️ 실행 순서: Vercel에 새 코드가 "배포 완료(Ready)"된 뒤에 실행하세요.
--    먼저 실행하면 관리자 로그인과 마스터 데이터 수정이 잠시 막힙니다.
--
-- 여러 번 실행해도 안전합니다.
-- ============================================

-- 1) RLS 켜기 — 정책이 없는 테이블은 anon 키로 아무것도 못 한다 (서비스 롤 키만 접근)
ALTER TABLE public.master_training_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.required_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- 2) 목록 테이블은 "읽기만" 공개 (연수 등록 화면·필수 연수 안내 화면에서 사용)
--    추가/수정/삭제는 관리자 API(/api/admin/lookup)가 서비스 롤 키로 처리한다
DROP POLICY IF EXISTS "Anyone can read master training names" ON public.master_training_names;
CREATE POLICY "Anyone can read master training names" ON public.master_training_names
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read master institutions" ON public.master_institutions;
CREATE POLICY "Anyone can read master institutions" ON public.master_institutions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can read required trainings" ON public.required_trainings;
CREATE POLICY "Anyone can read required trainings" ON public.required_trainings
  FOR SELECT TO anon, authenticated USING (true);

-- 3) admin_config(관리자 비밀번호)는 정책을 만들지 않는다 = 외부에서 읽기·쓰기 모두 차단

-- 4) verify_admin_password 함수 — 앱 코드에서 쓰지 않으므로 외부 실행 권한 회수
--    (인자 구성이 달라도 모두 처리하도록 반복문 사용)
DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'verify_admin_password'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 5) 확인용 — 4개 테이블 모두 rowsecurity = true 가 나와야 정상
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('master_training_names', 'master_institutions', 'required_trainings', 'admin_config');

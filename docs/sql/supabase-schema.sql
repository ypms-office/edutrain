-- ============================================
-- 교사 연수 관리 시스템 - Supabase Database Schema
-- ============================================

-- users 테이블 생성
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('교장', '교감', '부장', '교사', '교직원')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- trainings 테이블 생성
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('직무(원격)', '직무(집합)', '직무(혼합)')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  is_paid BOOLEAN DEFAULT false,
  fee INTEGER DEFAULT 0,
  has_certificate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- certificates 테이블 생성
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID UNIQUE NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- master_training_names 테이블 생성
CREATE TABLE master_training_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- master_institutions 테이블 생성
CREATE TABLE master_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_config 테이블 생성
CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_trainings_user_id ON trainings(user_id);
CREATE INDEX idx_trainings_end_date ON trainings(end_date DESC);
CREATE INDEX idx_certificates_training_id ON certificates(training_id);

-- 기본 마스터 데이터 삽입 (연수명 12개)
INSERT INTO master_training_names (name, display_order) VALUES
('법정의무연수 묶음과정A', 1),
('청렴·부패방지 교육', 2),
('아동학대 예방 및 신고의무자 교육', 3),
('성폭력·성희롱·성매매 예방교육', 4),
('학교폭력 예방 및 대응', 5),
('장애인식 개선 교육', 6),
('개인정보보호 교육', 7),
('응급처치 및 심폐소생술(CPR) 교육', 8),
('교육과정 재구성 역량 강화', 9),
('디지털 리터러시 교육', 10),
('학생 생활지도 및 상담', 11),
('학급경영 및 교실문화 조성', 12);

-- 기본 마스터 데이터 삽입 (기관명 6개)
INSERT INTO master_institutions (name, display_order) VALUES
('서울특별시교육청연수원', 1),
('한국교원대학교 종합교육연수원', 2),
('중앙교육연수원', 3),
('티처빌', 4),
('에듀니티', 5),
('학교 자체 연수', 6);

-- required_trainings 테이블 생성 (필수 연수 안내)
CREATE TABLE required_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 비밀번호 설정 (기본값: admin1234)
INSERT INTO admin_config (config_key, config_value) VALUES
('admin_password', 'admin1234');

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- users 테이블 RLS 정책
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- trainings 테이블 RLS 정책
CREATE POLICY "Users can view own trainings" ON trainings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trainings" ON trainings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trainings" ON trainings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trainings" ON trainings
  FOR DELETE USING (auth.uid() = user_id);

-- certificates 테이블 RLS 정책
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM trainings WHERE id = training_id)
  );

CREATE POLICY "Users can insert own certificates" ON certificates
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM trainings WHERE id = training_id)
  );

CREATE POLICY "Users can delete own certificates" ON certificates
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM trainings WHERE id = training_id)
  );
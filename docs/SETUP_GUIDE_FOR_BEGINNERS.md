# 비개발자를 위한 EduTrain 연수 관리 시스템 구축 가이드

> 이 가이드는 프로그래밍 경험이 없는 분도 동일한 교사 연수 관리 시스템을 처음부터 배포까지 완성할 수 있도록 작성되었습니다.
> 모든 단계를 스크린샷 설명과 함께 따라하기 형태로 안내합니다.

---

## 목차

1. [전체 흐름 이해하기](#1-전체-흐름-이해하기)
2. [사전 준비물](#2-사전-준비물)
3. [Step 1: GitHub 계정 만들기 & 코드 복사하기](#step-1-github-계정-만들기--코드-복사하기)
4. [Step 2: Supabase 프로젝트 만들기](#step-2-supabase-프로젝트-만들기)
5. [Step 3: 데이터베이스 테이블 만들기](#step-3-데이터베이스-테이블-만들기)
6. [Step 4: 파일 저장소(Storage) 설정하기](#step-4-파일-저장소storage-설정하기)
7. [Step 5: 인증(Authentication) 설정하기](#step-5-인증authentication-설정하기)
8. [Step 6: Supabase API 키 확인하기](#step-6-supabase-api-키-확인하기)
9. [Step 7: Vercel에 배포하기](#step-7-vercel에-배포하기)
10. [Step 8: Vercel 환경변수 설정하기](#step-8-vercel-환경변수-설정하기)
11. [Step 9: Supabase에 배포 URL 등록하기](#step-9-supabase에-배포-url-등록하기)
12. [Step 10: 무료 일시정지 방지 설정 (Keep-Alive)](#step-10-무료-일시정지-방지-설정-keep-alive)
13. [Step 11: 배포 확인 및 첫 사용](#step-11-배포-확인-및-첫-사용)
14. [문제 해결 (FAQ)](#문제-해결-faq)
15. [용어 사전](#용어-사전)
16. [전체 체크리스트](#전체-체크리스트)

---

## 1. 전체 흐름 이해하기

이 시스템은 **3개의 무료 서비스**를 조합하여 만들어집니다:

```
┌─────────────────────────────────────────────────────────────┐
│                    시스템 구성 개요도                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [GitHub]              [Supabase]           [Vercel]       │
│   코드 저장소            데이터베이스          웹사이트 배포    │
│                         + 파일 저장소                        │
│                         + 로그인 시스템                      │
│                                                             │
│   소스 코드를        →   데이터를 저장하고  →  완성된 웹사이트를 │
│   보관합니다             관리합니다           세상에 공개합니다 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 각 서비스의 역할

| 서비스 | 역할 | 비유 | 무료 조건 |
|--------|------|------|-----------|
| **GitHub** | 소스 코드를 저장하는 곳 | "설계도 보관함" | 무제한 무료 |
| **Supabase** | 데이터베이스 + 파일 저장 + 로그인 | "건물의 기반 시설" | 2개 프로젝트 무료 |
| **Vercel** | 웹사이트를 인터넷에 공개 | "건물의 간판·출입문" | 개인 사용 무료 |

### 소요 시간

- 처음 하는 경우: **약 1~2시간**
- 익숙해진 경우: **약 30분**

---

## 2. 사전 준비물

시작하기 전에 다음을 준비하세요:

| 항목 | 설명 | 비고 |
|------|------|------|
| 컴퓨터 | Windows, Mac 모두 가능 | 인터넷 연결 필요 |
| 웹 브라우저 | Chrome 권장 | 최신 버전 |
| 이메일 주소 | Gmail 권장 | 3개 서비스 가입에 사용 |

> 별도의 프로그램 설치는 필요하지 않습니다. 모든 작업을 웹 브라우저에서 진행합니다.

---

## Step 1: GitHub 계정 만들기 & 코드 복사하기

### 1-1. GitHub 가입하기

1. 웹 브라우저에서 **https://github.com** 접속
2. 오른쪽 상단의 **"Sign up"** 클릭
3. 이메일, 비밀번호, 사용자명 입력 후 가입 완료
4. 이메일 인증 완료

### 1-2. 프로젝트 코드 Fork(복사)하기

> "Fork"란 다른 사람의 코드를 내 계정에 복사하는 것입니다.

1. 원본 프로젝트 GitHub 페이지 접속
2. 오른쪽 상단의 **"Fork"** 버튼 클릭

   ```
   ┌──────────────────────────────────────┐
   │  [Code]  [Issues]  [Pull requests]   │
   │                          [⭐ Star]   │
   │                          [🔱 Fork] ← 이 버튼 클릭!
   └──────────────────────────────────────┘
   ```

3. **"Create fork"** 클릭
4. 잠시 후 내 계정에 동일한 프로젝트가 복사됩니다

### 1-3. 복사 완료 확인

- 주소가 `github.com/내아이디/edutrain` 형태로 바뀌었는지 확인
- 모든 파일이 그대로 복사되었는지 확인

---

## Step 2: Supabase 프로젝트 만들기

### 2-1. Supabase 가입하기

1. **https://supabase.com** 접속
2. **"Start your project"** 또는 **"Sign Up"** 클릭
3. **"Continue with GitHub"** 클릭 (GitHub 계정으로 간편 가입)

   ```
   ┌────────────────────────────────────┐
   │        Sign in to Supabase         │
   │                                    │
   │   [🐙 Continue with GitHub] ← 클릭 │
   │                                    │
   │   ───── or ─────                   │
   │                                    │
   │   Email: ___________               │
   │   Password: ________               │
   └────────────────────────────────────┘
   ```

4. GitHub 접근 권한 허용

### 2-2. 새 Organization(조직) 만들기

> 처음 가입하면 자동으로 만들어집니다. 이미 있다면 건너뛰세요.

### 2-3. 새 프로젝트 만들기

1. Supabase 대시보드에서 **"New Project"** 클릭
2. 다음 정보를 입력합니다:

   | 항목 | 입력값 | 설명 |
   |------|--------|------|
   | **Project name** | `edutrain` | 프로젝트 이름 (원하는 이름) |
   | **Database Password** | (강력한 비밀번호) | 꼭 메모해두세요! |
   | **Region** | `Northeast Asia (Tokyo)` | 한국에서 가장 가까운 서버 |

   ```
   ┌────────────────────────────────────┐
   │         Create a new project       │
   │                                    │
   │   Organization: [내 Organization]   │
   │                                    │
   │   Project name:                    │
   │   [ edutrain                   ]   │
   │                                    │
   │   Database Password:               │
   │   [ ●●●●●●●●●●●●              ]   │
   │   (⚠ 이 비밀번호를 메모해두세요!)    │
   │                                    │
   │   Region:                          │
   │   [ Northeast Asia (Tokyo)  ▼ ]    │
   │                                    │
   │          [Create new project]       │
   └────────────────────────────────────┘
   ```

3. **"Create new project"** 클릭
4. **2~3분** 정도 기다리면 프로젝트가 생성됩니다

   > 화면에 "Setting up project..." 메시지가 표시됩니다. 잠시 기다려주세요.

---

## Step 3: 데이터베이스 테이블 만들기

> 데이터베이스는 엑셀 시트와 비슷합니다. "테이블"은 엑셀의 "시트"에 해당합니다.
> 이 시스템에서는 7개의 테이블(시트)을 만들어야 합니다.

### 3-1. SQL Editor 열기

1. Supabase 대시보드 왼쪽 메뉴에서 **"SQL Editor"** 클릭

   ```
   ┌──────────────┐
   │ 📊 Dashboard  │
   │ 📝 Table Ed.  │
   │ 🔐 Auth       │
   │ 📦 Storage    │
   │ ⚡ Edge Func.  │
   │ 📋 SQL Editor │ ← 이것을 클릭!
   │ ⚙️ Settings    │
   └──────────────┘
   ```

2. 빈 쿼리 창이 열립니다

### 3-2. 테이블 생성 SQL 실행하기

1. 아래의 SQL 코드를 **전체 선택(Ctrl+A)** 하여 복사합니다
2. SQL Editor에 **붙여넣기(Ctrl+V)**
3. 오른쪽 하단의 **"Run"** 버튼(또는 Ctrl+Enter) 클릭

```sql
-- ============================================
-- 교사 연수 관리 시스템 - 데이터베이스 전체 설정
-- ============================================
-- 이 SQL을 Supabase SQL Editor에 붙여넣고 실행하세요.
-- 테이블, 인덱스, 보안정책, 기본 데이터를 모두 생성합니다.

-- ────────────────────────────────────────────
-- 1. 테이블 생성
-- ────────────────────────────────────────────

-- 사용자(교사) 정보 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('교장', '교감', '부장', '교사', '교직원')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 연수 정보 테이블
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

-- 이수증 파일 정보 테이블
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID UNIQUE NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 연수명 마스터 데이터 테이블
CREATE TABLE master_training_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기관명 마스터 데이터 테이블
CREATE TABLE master_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 설정 테이블
CREATE TABLE admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 필수 연수 안내 테이블
CREATE TABLE required_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- 2. 인덱스 생성 (검색 속도 향상용)
-- ────────────────────────────────────────────

CREATE INDEX idx_trainings_user_id ON trainings(user_id);
CREATE INDEX idx_trainings_end_date ON trainings(end_date DESC);
CREATE INDEX idx_certificates_training_id ON certificates(training_id);

-- ────────────────────────────────────────────
-- 3. 기본 데이터 삽입
-- ────────────────────────────────────────────

-- 연수명 기본 12개
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

-- 기관명 기본 6개
INSERT INTO master_institutions (name, display_order) VALUES
('서울특별시교육청연수원', 1),
('한국교원대학교 종합교육연수원', 2),
('중앙교육연수원', 3),
('티처빌', 4),
('에듀니티', 5),
('학교 자체 연수', 6);

-- 관리자 기본 비밀번호 (배포 후 반드시 변경하세요!)
INSERT INTO admin_config (config_key, config_value) VALUES
('admin_password', 'admin1234');

-- ────────────────────────────────────────────
-- 4. 보안 정책 (RLS) 설정
-- ────────────────────────────────────────────
-- RLS란? 각 사용자가 자기 데이터만 볼 수 있게 하는 보안 장치입니다.

-- users 테이블 보안 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- trainings 테이블 보안 활성화
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trainings" ON trainings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trainings" ON trainings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trainings" ON trainings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trainings" ON trainings
  FOR DELETE USING (auth.uid() = user_id);

-- certificates 테이블 보안 활성화
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

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
```

### 3-3. 실행 결과 확인

- 하단에 **"Success. No rows returned"** 메시지가 나오면 성공입니다

   ```
   ┌────────────────────────────────────────┐
   │  ✅ Success. No rows returned          │
   │  (성공! 반환된 행 없음)                  │
   └────────────────────────────────────────┘
   ```

- 에러가 나면 [문제 해결 FAQ](#문제-해결-faq) 섹션을 참고하세요

### 3-4. 테이블 생성 확인하기

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 7개 테이블이 보이는지 확인:

   | 번호 | 테이블명 | 용도 |
   |------|----------|------|
   | 1 | `users` | 교사(사용자) 정보 |
   | 2 | `trainings` | 연수 기록 |
   | 3 | `certificates` | 이수증 파일 정보 |
   | 4 | `master_training_names` | 연수명 목록 (12개 기본값) |
   | 5 | `master_institutions` | 연수 기관명 목록 (6개 기본값) |
   | 6 | `admin_config` | 관리자 설정 |
   | 7 | `required_trainings` | 필수 연수 안내 |

3. `master_training_names` 테이블을 클릭하면 12개의 연수명이 들어있는지 확인
4. `master_institutions` 테이블을 클릭하면 6개의 기관명이 들어있는지 확인

---

## Step 4: 파일 저장소(Storage) 설정하기

> Storage는 이수증 파일(PDF, 이미지)을 저장하는 곳입니다.

### 4-1. Storage 버킷 만들기

1. 왼쪽 메뉴에서 **"Storage"** 클릭
2. **"New bucket"** 버튼 클릭
3. 다음과 같이 설정:

   | 항목 | 설정값 | 설명 |
   |------|--------|------|
   | **Bucket name** | `certificates` | 이수증 파일 저장 공간 |
   | **Public bucket** | **꺼짐 (OFF)** | 보안을 위해 비공개 |
   | **File size limit** | `5` (MB) | 최대 파일 크기 |
   | **Allowed MIME types** | 아래 3개 입력 | 허용 파일 형식 |

   Allowed MIME types에 다음 3가지를 입력합니다:
   ```
   application/pdf
   image/jpeg
   image/png
   ```

   ```
   ┌────────────────────────────────────┐
   │       Create a new bucket          │
   │                                    │
   │   Name: [ certificates         ]   │
   │                                    │
   │   Public bucket: [ OFF 🔴 ]        │
   │   (비공개로 설정!)                   │
   │                                    │
   │   File size limit: [ 5 ] MB        │
   │                                    │
   │   Allowed MIME types:              │
   │   [ application/pdf            ]   │
   │   [ image/jpeg                 ]   │
   │   [ image/png                  ]   │
   │                                    │
   │          [Create bucket]           │
   └────────────────────────────────────┘
   ```

4. **"Create bucket"** 클릭

### 4-2. Storage 보안 정책 설정하기

> 각 교사가 자기 파일만 업로드/다운로드/삭제할 수 있게 보안 정책을 설정합니다.

1. 다시 왼쪽 메뉴의 **"SQL Editor"** 클릭
2. 아래 SQL을 복사해서 붙여넣기
3. **"Run"** 클릭

```sql
-- ============================================
-- Storage 보안 정책 설정
-- ============================================
-- 각 교사가 자기 폴더의 파일만 관리할 수 있게 합니다.

-- 정책 1: 자기 이수증만 업로드 가능
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 정책 2: 자기 이수증만 볼 수 있음
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 정책 3: 자기 이수증만 삭제 가능
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

4. **"Success"** 메시지 확인

---

## Step 5: 인증(Authentication) 설정하기

> 인증 설정은 회원가입/로그인 방식을 결정합니다.

### 5-1. Email 인증 설정

1. 왼쪽 메뉴에서 **"Authentication"** 클릭
2. 상단 탭에서 **"Providers"** 클릭
3. **"Email"** 항목 확인 (기본적으로 활성화 되어 있음)
4. Email 항목을 클릭하여 열고, 다음을 설정:

   | 항목 | 설정값 | 설명 |
   |------|--------|------|
   | **Enable Email provider** | **ON** | 이메일 로그인 활성화 |
   | **Confirm email** | **OFF** | 이메일 확인 비활성화 (학교 내부용이므로) |
   | **Secure email change** | OFF | (선택사항) |

   ```
   ┌────────────────────────────────────┐
   │        Email Provider               │
   │                                    │
   │   Enable Email provider: [ON  🟢] │
   │                                    │
   │   Confirm email: [OFF 🔴]          │
   │   (⚠ 반드시 끄세요! 내부 앱이므로   │
   │    이메일 확인이 불필요합니다)        │
   │                                    │
   │              [Save]                │
   └────────────────────────────────────┘
   ```

5. **"Save"** 클릭

> **왜 "Confirm email"을 끄나요?**
> 이 시스템은 실제 이메일 주소가 아닌 이름 기반 내부 계정을 사용합니다.
> 이메일 확인을 켜면 가입이 되지 않습니다.

### 5-2. URL Configuration 설정 (나중에 설정)

> 이 설정은 [Step 9](#step-9-supabase에-배포-url-등록하기)에서 Vercel 배포 후에 합니다.
> 지금은 건너뛰세요.

---

## Step 6: Supabase API 키 확인하기

> API 키는 우리 웹사이트가 Supabase와 통신하기 위한 "비밀번호"입니다.
> 이 키들을 나중에 Vercel에 입력해야 합니다. **반드시 안전하게 메모해두세요.**

### 6-1. API 키 찾기

1. 왼쪽 메뉴에서 **"Project Settings"** (톱니바퀴 아이콘) 클릭
2. 왼쪽 하위 메뉴에서 **"API"** 클릭
3. 다음 3가지 정보를 **메모장이나 텍스트 파일에 복사해서 저장**합니다:

   ```
   ┌──────────────────────────────────────────────┐
   │              API Settings                     │
   │                                               │
   │   Project URL                                 │
   │   ┌────────────────────────────────────┐      │
   │   │ https://abcdefghij.supabase.co    │ [복사] │
   │   └────────────────────────────────────┘      │
   │   → 메모: "NEXT_PUBLIC_SUPABASE_URL"          │
   │                                               │
   │   Project API keys                            │
   │                                               │
   │   anon (public)                               │
   │   ┌────────────────────────────────────┐      │
   │   │ eyJhbGciOiJIUzI1NiIs...           │ [복사] │
   │   └────────────────────────────────────┘      │
   │   → 메모: "NEXT_PUBLIC_SUPABASE_ANON_KEY"     │
   │                                               │
   │   service_role (secret)                       │
   │   ┌────────────────────────────────────┐      │
   │   │ eyJhbGciOiJIUzI1NiIs...           │ [복사] │
   │   └────────────────────────────────────┘      │
   │   → 메모: "SUPABASE_SERVICE_ROLE_KEY"         │
   │   ⚠ 이 키는 절대 외부에 공개하지 마세요!       │
   │                                               │
   └──────────────────────────────────────────────┘
   ```

### 6-2. 메모해야 할 정보 정리

아래 형식으로 메모장에 저장해두세요 (나중에 Vercel에 입력합니다):

```
=== Supabase 설정 정보 (외부 공유 금지!) ===

NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_붙여넣기
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_key_붙여넣기
```

> **보안 경고**: `service_role` 키는 데이터베이스의 모든 데이터에 접근할 수 있는 "마스터 키"입니다.
> 카카오톡, 이메일, SNS 등에 절대 공유하지 마세요!

---

## Step 7: Vercel에 배포하기

> Vercel은 GitHub에 올린 코드를 자동으로 웹사이트로 만들어주는 서비스입니다.

### 7-1. Vercel 가입하기

1. **https://vercel.com** 접속
2. **"Sign Up"** 클릭
3. **"Continue with GitHub"** 클릭 (GitHub 계정으로 간편 가입)

   ```
   ┌────────────────────────────────────┐
   │         Sign Up to Vercel          │
   │                                    │
   │   [🐙 Continue with GitHub] ← 클릭 │
   │   [ Continue with GitLab  ]        │
   │   [ Continue with Bitbucket]       │
   └────────────────────────────────────┘
   ```

4. GitHub 접근 권한 허용

### 7-2. 프로젝트 Import(가져오기)

1. Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
2. **"Import Git Repository"** 섹션에서:
   - GitHub 계정이 연결되어 있으면 내 리포지토리 목록이 보입니다
   - `edutrain` (또는 Fork한 프로젝트명)을 찾아서 **"Import"** 클릭

   ```
   ┌──────────────────────────────────────┐
   │      Import Git Repository           │
   │                                      │
   │   🔍 Search...                       │
   │                                      │
   │   내아이디/edutrain      [Import] ← 클릭
   │   내아이디/other-repo    [Import]    │
   └──────────────────────────────────────┘
   ```

### 7-3. 프로젝트 설정

Import 후 설정 화면에서:

| 항목 | 설정값 | 설명 |
|------|--------|------|
| **Project Name** | `edutrain` (또는 원하는 이름) | URL에 사용됩니다 |
| **Framework Preset** | `Next.js` (자동 감지됨) | 변경 불필요 |
| **Root Directory** | `.` (기본값) | 변경 불필요 |
| **Build Command** | `next build` (기본값) | 변경 불필요 |

> **아직 "Deploy" 버튼을 누르지 마세요!** 먼저 환경변수를 설정해야 합니다.

---

## Step 8: Vercel 환경변수 설정하기

> 환경변수란 웹사이트가 Supabase와 연결되기 위한 "연결 정보"입니다.
> 이 단계가 가장 중요합니다. 하나라도 빠지면 사이트가 작동하지 않습니다!

### 8-1. 환경변수 입력하기 (배포 전)

Import 화면의 **"Environment Variables"** 섹션을 펼칩니다:

하나씩 다음 변수들을 추가합니다. 각각 **Name**과 **Value**를 입력하고 **"Add"** 클릭:

| 순서 | Name (정확히 이대로 입력!) | Value (Step 6에서 메모한 값) |
|------|---------------------------|------------------------------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role key) |
| 4 | `CRON_SECRET` | 아무 랜덤 문자열 (예: `my-super-secret-cron-key-2024`) |

```
┌──────────────────────────────────────────────┐
│        Environment Variables                  │
│                                               │
│   Name:  [ NEXT_PUBLIC_SUPABASE_URL       ]   │
│   Value: [ https://xxxxx.supabase.co      ]   │
│                                 [Add] ← 클릭  │
│                                               │
│   ✅ NEXT_PUBLIC_SUPABASE_URL     https://... │
│   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY eyJhb...   │
│   ✅ SUPABASE_SERVICE_ROLE_KEY     eyJhb...   │
│   ✅ CRON_SECRET                   my-su...   │
│                                               │
│   (4개 모두 추가되었는지 확인!)                  │
└──────────────────────────────────────────────┘
```

> **CRON_SECRET**은 직접 만드는 비밀 문자열입니다.
> 영문+숫자 조합으로 20자 이상 만드세요. 예: `keep-alive-secret-edutrain-2024-xyz`

### 8-2. 배포하기

1. 환경변수 4개가 모두 추가되었는지 한번 더 확인
2. **"Deploy"** 버튼 클릭!

   ```
   ┌────────────────────────────────────┐
   │                                    │
   │          [ 🚀 Deploy ]             │
   │                                    │
   └────────────────────────────────────┘
   ```

3. 빌드가 시작됩니다 (약 1~3분 소요)
4. 성공하면 축하 화면과 함께 배포 URL이 표시됩니다!

   ```
   ┌────────────────────────────────────────┐
   │   🎉 Congratulations!                  │
   │                                        │
   │   Your project has been deployed.       │
   │                                        │
   │   🔗 https://edutrain.vercel.app       │
   │                                        │
   │   [Continue to Dashboard]              │
   └────────────────────────────────────────┘
   ```

5. 표시된 URL을 메모합니다 (예: `https://edutrain.vercel.app`)

### 8-3. 배포 후 환경변수 추가/수정 방법

> 나중에 환경변수를 수정해야 할 때:

1. Vercel 대시보드에서 프로젝트 클릭
2. 상단 탭에서 **"Settings"** 클릭
3. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
4. 변수를 추가하거나 수정
5. 변경 후 **반드시 재배포 필요!**
   - 상단 탭 **"Deployments"** → 가장 최근 배포의 **"..."** 메뉴 → **"Redeploy"** 클릭

---

## Step 9: Supabase에 배포 URL 등록하기

> Supabase가 우리 웹사이트의 주소를 알아야 로그인이 정상 작동합니다.

### 9-1. Site URL 설정

1. **Supabase 대시보드**로 돌아갑니다
2. 왼쪽 메뉴에서 **"Authentication"** 클릭
3. 왼쪽 하위 메뉴에서 **"URL Configuration"** 클릭
4. 다음을 설정합니다:

   | 항목 | 입력값 | 예시 |
   |------|--------|------|
   | **Site URL** | Vercel 배포 URL | `https://edutrain.vercel.app` |
   | **Redirect URLs** | 배포 URL + `/**` | `https://edutrain.vercel.app/**` |

   ```
   ┌──────────────────────────────────────────────┐
   │          URL Configuration                    │
   │                                               │
   │   Site URL:                                   │
   │   [ https://edutrain.vercel.app           ]   │
   │                                               │
   │   Redirect URLs:                              │
   │   [ https://edutrain.vercel.app/**        ]   │
   │                               [Add URL]       │
   │                                               │
   │                   [Save]                       │
   └──────────────────────────────────────────────┘
   ```

5. **"Save"** 클릭

---

## Step 10: 무료 일시정지 방지 설정 (Keep-Alive)

> **중요**: Supabase 무료 플랜은 **7일간 아무도 사용하지 않으면 자동으로 일시정지**됩니다.
> 이를 방지하기 위해 3일마다 자동으로 "살아있니?" 신호를 보내는 설정을 합니다.

### 방법 1: Vercel Cron (권장 - 이미 설정됨)

이 프로젝트에는 이미 Keep-Alive 시스템이 내장되어 있습니다:

- `vercel.json` 파일에 3일마다 실행되는 Cron Job이 설정되어 있음
- `app/api/keep-alive/route.ts`에 API가 구현되어 있음
- Vercel 배포 시 자동으로 활성화됩니다

```json
{
  "crons": [
    {
      "path": "/api/keep-alive",
      "schedule": "0 0 */3 * *"
    }
  ]
}
```

> Vercel 무료 플랜에서는 Cron Job 실행 횟수에 제한이 있을 수 있습니다.
> 더 확실한 방법을 원하면 아래 방법 2를 추가로 설정하세요.

### 방법 2: GitHub Actions (추가 안전장치)

1. GitHub에서 Fork한 프로젝트 페이지 접속
2. 상단의 **"Settings"** 탭 클릭
3. 왼쪽 메뉴에서 **"Secrets and variables"** → **"Actions"** 클릭
4. **"New repository secret"** 버튼을 클릭하여 2개의 시크릿 추가:

   | Name | Value | 설명 |
   |------|-------|------|
   | `SITE_URL` | `https://edutrain.vercel.app` | 배포된 사이트 URL (끝에 `/` 없이) |
   | `CRON_SECRET` | Vercel에 입력한 것과 동일한 값 | Keep-Alive 인증용 |

   ```
   ┌──────────────────────────────────────────────┐
   │        Actions secrets                        │
   │                                               │
   │   [🔒 New repository secret]                  │
   │                                               │
   │   Name:  [ SITE_URL                       ]   │
   │   Secret:[ https://edutrain.vercel.app    ]   │
   │                            [Add secret]       │
   │                                               │
   │   ✅ SITE_URL          Updated just now       │
   │   ✅ CRON_SECRET       Updated just now       │
   └──────────────────────────────────────────────┘
   ```

5. **"Actions"** 탭으로 이동
6. "I understand my workflows, go ahead and enable them" 클릭 (첫 Fork 시)
7. 왼쪽에 **"Supabase Keep-Alive"** 워크플로우가 보이면 성공

### Keep-Alive 테스트하기

1. **"Actions"** 탭 → **"Supabase Keep-Alive"** 클릭
2. **"Run workflow"** → **"Run workflow"** 클릭 (수동 실행)
3. 실행이 성공(초록색 체크)하면 정상 작동

   ```
   ┌──────────────────────────────────────┐
   │  ✅ Supabase Keep-Alive             │
   │     Run workflow ▶                  │
   │                                      │
   │  ✅ #1 - 성공 - 1분 전              │
   └──────────────────────────────────────┘
   ```

---

## Step 11: 배포 확인 및 첫 사용

### 11-1. 사이트 접속 확인

1. Vercel에서 받은 URL (예: `https://edutrain.vercel.app`)을 브라우저에 입력
2. 로그인 페이지가 표시되면 성공!

### 11-2. 첫 번째 사용자 등록

1. **"회원가입"** 클릭
2. 이름, 비밀번호, 직위를 입력하여 가입
3. 로그인 후 대시보드가 표시되는지 확인

### 11-3. 관리자 접속

1. 주소 끝에 `/admin`을 붙여서 접속 (예: `https://edutrain.vercel.app/admin`)
2. 기본 관리자 비밀번호: **`admin1234`**
3. **배포 후 반드시 관리자 비밀번호를 변경하세요!**

   관리자 비밀번호 변경 방법:
   1. Supabase 대시보드 → **Table Editor** → `admin_config` 테이블
   2. `config_key`가 `admin_password`인 행의 `config_value`를 수정
   3. 원하는 비밀번호로 변경 후 저장

   ```
   ┌──────────────────────────────────────────────┐
   │  Table: admin_config                          │
   │                                               │
   │  config_key      │ config_value               │
   │  ─────────────────┼─────────────────          │
   │  admin_password   │ admin1234  ← 이 값을 변경! │
   └──────────────────────────────────────────────┘
   ```

### 11-4. 기본 동작 확인 체크리스트

- [ ] 회원가입이 되는가?
- [ ] 로그인이 되는가?
- [ ] 대시보드가 표시되는가?
- [ ] 연수를 등록할 수 있는가?
- [ ] 이수증 파일을 업로드할 수 있는가?
- [ ] 관리자 페이지에 접속할 수 있는가?
- [ ] 관리자 대시보드에서 교사 목록이 보이는가?

---

## 문제 해결 (FAQ)

### Q1. 배포는 성공했는데 사이트가 빈 화면이에요

**원인**: 환경변수가 잘못 설정되었을 가능성이 높습니다.

**해결**:
1. Vercel 대시보드 → Settings → Environment Variables
2. 4개 변수가 모두 있는지 확인
3. 변수명에 오타가 없는지 확인 (대소문자 구분!)
4. 값에 앞뒤 공백이 없는지 확인
5. 수정 후 반드시 **Redeploy**

### Q2. "Invalid API key" 에러가 나요

**원인**: Supabase API 키가 잘못 복사되었습니다.

**해결**:
1. Supabase → Settings → API에서 키를 다시 복사
2. 복사할 때 처음과 끝에 공백이 포함되지 않았는지 확인
3. `anon key`와 `service_role key`가 뒤바뀌지 않았는지 확인

### Q3. 회원가입이 안 돼요

**원인**: Supabase Authentication의 "Confirm email"이 켜져 있을 수 있습니다.

**해결**:
1. Supabase → Authentication → Providers → Email
2. **"Confirm email"이 OFF**인지 확인
3. Save 클릭

### Q4. 이수증 업로드가 안 돼요

**원인**: Storage 버킷이나 보안 정책이 설정되지 않았을 수 있습니다.

**해결**:
1. Supabase → Storage에서 `certificates` 버킷이 있는지 확인
2. 없으면 [Step 4](#step-4-파일-저장소storage-설정하기)를 다시 진행
3. SQL Editor에서 Storage 보안 정책 SQL을 다시 실행

### Q5. SQL 실행 시 "already exists" 에러

**원인**: 이미 테이블이나 정책이 만들어져 있는 상태에서 다시 실행한 경우입니다.

**해결**:
- 이 에러는 무시해도 됩니다. 이미 설정이 완료된 상태입니다.
- 처음부터 다시 하고 싶다면, Supabase 프로젝트를 삭제하고 새로 만드세요.

### Q6. Vercel 빌드가 실패해요

**원인**: 여러 가지 가능성이 있습니다.

**해결**:
1. Vercel → Deployments → 실패한 배포 클릭 → 로그 확인
2. 환경변수가 모두 설정되어 있는지 확인
3. GitHub에 최신 코드가 올라가 있는지 확인

### Q7. 사이트가 갑자기 안 돼요 (며칠 후)

**원인**: Supabase 무료 프로젝트가 일시정지되었을 수 있습니다.

**해결**:
1. Supabase 대시보드 접속
2. 프로젝트가 "Paused" 상태이면 **"Restore"** 클릭
3. [Step 10](#step-10-무료-일시정지-방지-설정-keep-alive)의 Keep-Alive 설정 확인

### Q8. 관리자 비밀번호를 잊어버렸어요

**해결**:
1. Supabase → Table Editor → `admin_config` 테이블
2. `admin_password` 행의 `config_value` 값을 직접 확인하거나 변경

---

## 용어 사전

비개발자가 자주 접하게 될 용어들을 정리했습니다:

| 용어 | 쉬운 설명 |
|------|-----------|
| **GitHub** | 코드를 보관하는 인터넷 서비스 (Google Drive 코드 버전) |
| **Fork** | 다른 사람의 코드를 내 계정에 복사하기 |
| **Repository (리포지토리)** | GitHub에서 하나의 프로젝트 폴더 |
| **Supabase** | 데이터를 저장하고 로그인을 관리하는 서비스 |
| **데이터베이스 (DB)** | 데이터를 체계적으로 저장하는 곳 (엑셀과 비슷) |
| **테이블** | 데이터베이스 안의 표 하나 (엑셀의 시트와 비슷) |
| **SQL** | 데이터베이스에 명령을 내리는 언어 |
| **RLS** | 각 사용자가 자기 데이터만 볼 수 있게 하는 보안 설정 |
| **Storage** | 파일(PDF, 이미지 등)을 저장하는 공간 |
| **Bucket (버킷)** | Storage 안의 폴더 |
| **API Key** | 서비스를 사용하기 위한 비밀번호 같은 문자열 |
| **Vercel** | 코드를 웹사이트로 만들어 인터넷에 공개해주는 서비스 |
| **배포 (Deploy)** | 코드를 웹사이트로 변환하여 인터넷에 공개하는 것 |
| **환경변수** | 웹사이트에 비밀 설정값을 전달하는 방법 |
| **Cron Job** | 정해진 시간마다 자동으로 실행되는 작업 |
| **Keep-Alive** | 서버가 잠들지 않도록 주기적으로 신호를 보내는 것 |
| **URL** | 웹사이트 주소 (예: https://google.com) |
| **Build (빌드)** | 코드를 웹사이트로 변환하는 과정 |
| **Redeploy** | 변경사항을 반영하여 다시 배포하기 |

---

## 전체 체크리스트

모든 단계를 완료했는지 확인하세요:

### 계정 준비
- [ ] GitHub 계정 생성 완료
- [ ] 프로젝트 Fork 완료
- [ ] Supabase 계정 생성 완료 (GitHub 연동)
- [ ] Vercel 계정 생성 완료 (GitHub 연동)

### Supabase 설정
- [ ] 새 프로젝트 생성 (Region: Tokyo)
- [ ] SQL Editor에서 테이블 생성 SQL 실행 완료
- [ ] 7개 테이블 생성 확인
- [ ] 기본 마스터 데이터 삽입 확인 (연수명 12개, 기관명 6개)
- [ ] Storage 버킷 `certificates` 생성 완료
- [ ] Storage 보안 정책 SQL 실행 완료
- [ ] Authentication > Email > Confirm email **OFF** 확인
- [ ] API 키 3개 메모 완료 (URL, anon key, service_role key)

### Vercel 설정
- [ ] GitHub 리포지토리 Import 완료
- [ ] 환경변수 `NEXT_PUBLIC_SUPABASE_URL` 추가
- [ ] 환경변수 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- [ ] 환경변수 `SUPABASE_SERVICE_ROLE_KEY` 추가
- [ ] 환경변수 `CRON_SECRET` 추가
- [ ] 배포(Deploy) 성공 확인

### 배포 후 설정
- [ ] Supabase > Authentication > URL Configuration > Site URL 설정
- [ ] Supabase > Authentication > URL Configuration > Redirect URLs 설정
- [ ] Keep-Alive 설정 확인 (Vercel Cron 또는 GitHub Actions)
- [ ] 관리자 비밀번호 변경 (admin1234 → 새 비밀번호)

### 동작 확인
- [ ] 사이트 접속 확인
- [ ] 회원가입 → 로그인 → 대시보드 확인
- [ ] 연수 등록 → 이수증 업로드 확인
- [ ] 관리자 로그인 → 대시보드 확인

---

## 부록: 마스터 데이터 커스터마이징

### 연수명 변경하기

학교 상황에 맞게 연수명 목록을 변경할 수 있습니다:

**방법 1: 관리자 페이지에서 변경 (권장)**
1. `/admin` 접속 → 관리자 로그인
2. **"마스터 데이터 관리"** 메뉴 클릭
3. 연수명 추가/수정/삭제/순서 변경

**방법 2: Supabase에서 직접 변경**
1. Supabase → Table Editor → `master_training_names`
2. 원하는 값을 직접 수정

### 기관명 변경하기

위와 동일한 방법으로 `master_institutions` 테이블을 수정합니다.

### 필수 연수 안내 추가하기

1. `/admin` 접속 → **"필수연수 관리"** 메뉴
2. 연수명과 URL을 입력하여 추가

---

## 부록: 커스텀 도메인 연결하기

기본 제공되는 `*.vercel.app` 주소 대신 자체 도메인을 사용하고 싶다면:

### 도메인 구매
1. 도메인 등록 업체에서 도메인 구매 (예: `my-school-training.kr`)

### Vercel에 도메인 연결
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. 구매한 도메인 입력 후 **"Add"**
3. Vercel이 안내하는 DNS 설정을 도메인 업체에서 적용

### Supabase URL 업데이트
1. Supabase → Authentication → URL Configuration
2. Site URL과 Redirect URLs를 새 도메인으로 변경

---

## 부록: 자동 업데이트 받기

원본 프로젝트가 업데이트되면 내 프로젝트에도 반영할 수 있습니다:

1. GitHub에서 Fork한 내 리포지토리 접속
2. **"Sync fork"** 버튼 클릭
3. **"Update branch"** 클릭
4. Vercel이 자동으로 재배포합니다

```
┌──────────────────────────────────────┐
│  ⚠ This branch is 3 commits behind  │
│                                      │
│  [Sync fork] ← 클릭                  │
│    └→ [Update branch] ← 클릭        │
└──────────────────────────────────────┘
```

---

> **축하합니다!** 이 가이드를 모두 따라했다면, 교사 연수 관리 시스템이 완성되었습니다.
> 문제가 발생하면 [문제 해결 FAQ](#문제-해결-faq)를 참고하시거나
> GitHub Issues에 질문을 등록해주세요.

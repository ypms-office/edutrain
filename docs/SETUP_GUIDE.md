# Next.js + Supabase + Vercel + GitHub Actions 프로젝트 설정 가이드

> EduTrain 프로젝트 기준으로 작성된 종합 설정 가이드입니다.
> 동일한 스택으로 새 프로젝트를 구축할 때 참고하세요.

---

## 목차

1. [기술 스택 요약](#1-기술-스택-요약)
2. [프로젝트 초기 설정](#2-프로젝트-초기-설정)
3. [Supabase 설정](#3-supabase-설정)
4. [Next.js 코드 구성](#4-nextjs-코드-구성)
5. [Vercel 배포 설정](#5-vercel-배포-설정)
6. [GitHub Actions 설정](#6-github-actions-설정)
7. [환경변수 총정리](#7-환경변수-총정리)
8. [체크리스트](#8-체크리스트)

---

## 1. 기술 스택 요약

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.x |
| 언어 | TypeScript | 5.x |
| UI | React + Tailwind CSS | 19.x / 4.x |
| 데이터베이스 | Supabase (PostgreSQL) | - |
| 인증 | Supabase Auth | - |
| 파일 저장 | Supabase Storage | - |
| 배포 | Vercel | - |
| CI/CD | GitHub Actions | - |

### 핵심 패키지

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install next react react-dom
npm install tailwindcss @tailwindcss/postcss autoprefixer postcss
npm install typescript @types/node @types/react @types/react-dom --save-dev
```

---

## 2. 프로젝트 초기 설정

### 2-1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest my-project --typescript --tailwind --app --src-dir=no
```

### 2-2. 디렉토리 구조

```
my-project/
├── app/                        # App Router 페이지 & API
│   ├── api/                    # API 라우트
│   │   ├── auth/               # 인증 관련 API
│   │   ├── admin/              # 관리자 API
│   │   └── keep-alive/         # Keep-Alive 엔드포인트
│   ├── login/                  # 로그인 페이지
│   ├── signup/                 # 회원가입 페이지
│   ├── dashboard/              # 대시보드 (보호 경로)
│   ├── components/             # 페이지별 컴포넌트
│   └── layout.tsx              # 루트 레이아웃
├── components/                 # 공통 컴포넌트
├── lib/
│   └── supabase/
│       ├── client.ts           # 브라우저용 클라이언트
│       ├── server.ts           # 서버용 클라이언트
│       ├── admin.ts            # 관리자용 클라이언트 (Service Role)
│       └── middleware.ts       # 세션 관리 미들웨어
├── middleware.ts                # 라우팅 미들웨어 (인증 보호)
├── .github/workflows/          # GitHub Actions 워크플로우
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 2-3. next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,    // X-Powered-By 헤더 제거 (보안)
  reactStrictMode: true,     // React Strict Mode
  compress: true,            // Gzip 압축
  experimental: {
    optimizeCss: true,       // CSS 최적화
  },
};

export default nextConfig;
```

### 2-4. tsconfig.json 핵심 설정

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 3. Supabase 설정

### 3-1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 > New Project
2. 프로젝트 이름, 데이터베이스 비밀번호, 리전 선택 (Northeast Asia - Tokyo 추천)
3. 생성 후 **Settings > API**에서 키 확인

### 3-2. 필요한 키 (Settings > API)

| 항목 | 위치 | 용도 |
|------|------|------|
| **Project URL** | `API Settings > URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon (public) key** | `API Settings > Project API keys` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | `API Settings > Project API keys` | `SUPABASE_SERVICE_ROLE_KEY` (비공개!) |

> **주의**: `service_role` 키는 RLS를 우회하므로 절대 클라이언트에 노출하면 안 됩니다.
> `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

### 3-3. 데이터베이스 스키마 (SQL Editor에서 실행)

SQL Editor(대시보드 좌측 메뉴)에서 아래와 같은 패턴으로 테이블을 생성합니다:

```sql
-- 테이블 생성
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('교장', '교감', '부장', '교사', '교직원')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (자주 조회하는 컬럼)
CREATE INDEX idx_trainings_user_id ON trainings(user_id);

-- RLS 활성화 (필수!)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile during signup" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 3-4. RLS (Row Level Security) 정책 패턴

```sql
-- 기본 패턴: 사용자는 자기 데이터만 접근
CREATE POLICY "policy_name" ON table_name
  FOR [SELECT|INSERT|UPDATE|DELETE]
  USING (auth.uid() = user_id);        -- SELECT/UPDATE/DELETE용
  -- 또는
  WITH CHECK (auth.uid() = user_id);   -- INSERT용

-- 관계 테이블 패턴: 부모 테이블의 user_id 참조
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM trainings WHERE id = training_id)
  );
```

### 3-5. Storage 버킷 설정

1. Dashboard > Storage > New Bucket
2. 버킷 이름 입력 (예: `certificates`)
3. Public bucket 여부 선택
4. File size limit 설정 (예: 1MB)
5. Allowed MIME types 설정 (예: `application/pdf, image/jpeg, image/png`)

**Storage RLS 정책도 필요합니다** (Storage > Policies):

```sql
-- 사용자가 자기 폴더에만 업로드/다운로드
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3-6. Authentication 설정

1. Dashboard > Authentication > Providers
2. Email provider 활성화 (기본 활성)
3. **"Confirm email" 비활성화** (내부 앱이라 이메일 확인 불필요 시)
4. Authentication > URL Configuration:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: `https://your-domain.vercel.app/**`

### 3-7. Free Tier 일시정지 방지 (Keep-Alive)

> Supabase Free Tier는 **7일 동안 활동이 없으면 프로젝트가 일시정지**됩니다.
> GitHub Actions로 3일마다 DB 쿼리를 보내 이를 방지합니다.

이 시스템의 구성은 [6장 GitHub Actions 설정](#6-github-actions-설정)에서 자세히 다룹니다.

---

## 4. Next.js 코드 구성

### 4-1. Supabase 클라이언트 (lib/supabase/)

프로젝트에서 Supabase 클라이언트를 **3가지 용도**로 나눠 사용합니다.

#### (A) 브라우저용 클라이언트 — `lib/supabase/client.ts`

클라이언트 컴포넌트(`"use client"`)에서 사용합니다. RLS 정책이 적용됩니다.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### (B) 서버용 클라이언트 — `lib/supabase/server.ts`

서버 컴포넌트, API 라우트에서 사용합니다. 쿠키 기반 세션을 처리하며 RLS 정책이 적용됩니다.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출되면 무시
          }
        },
      },
    }
  )
}
```

#### (C) 관리자용 클라이언트 — `lib/supabase/admin.ts`

**서버 전용**. Service Role Key를 사용하여 RLS를 우회합니다. 관리자 기능, cron job 등에 사용합니다.

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

### 4-2. 미들웨어 — 세션 관리 & 경로 보호

#### `lib/supabase/middleware.ts` (세션 갱신)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: createServerClient와 getUser() 사이에 다른 로직을 넣지 마세요
  const { data: { user } } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
```

#### `middleware.ts` (라우팅 미들웨어)

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { response: supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // 보호 경로 정의
  const protectedPaths = ['/dashboard', '/trainings', '/profile']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  const hasSession = !!user

  // 미인증 → 로그인 리다이렉트
  if (isProtectedPath && !hasSession) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 인증 완료 상태에서 로그인/가입 페이지 접근 → 대시보드
  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 4-3. API 라우트 패턴

#### 기본 CRUD API 패턴

```typescript
// app/api/some-resource/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('에러:', error)
    return NextResponse.json(
      { error: '데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

#### Keep-Alive API 패턴

```typescript
// app/api/keep-alive/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // CRON_SECRET 검증
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('users').select('id').limit(1)
    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Keep-alive 실패' }, { status: 500 })
  }
}
```

### 4-4. 파일 업로드 패턴 (Supabase Storage)

```typescript
// 업로드
const { error } = await supabase.storage
  .from('bucket-name')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

// 다운로드
const { data } = await supabase.storage
  .from('bucket-name')
  .download(filePath)

// 삭제
const { error } = await supabase.storage
  .from('bucket-name')
  .remove([filePath])

// Public URL 가져오기
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(filePath)
```

---

## 5. Vercel 배포 설정

### 5-1. Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) 접속 > Add New Project
2. GitHub 리포지토리 Import
3. Framework Preset: **Next.js** (자동 감지됨)
4. Root Directory: `.` (기본값)
5. Build Command: `next build` (기본값)
6. Output Directory: `.next` (기본값)

### 5-2. Vercel 환경변수 설정

**Settings > Environment Variables**에서 다음을 추가합니다:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role key) | Production, Preview, Development |
| `CRON_SECRET` | 임의의 시크릿 문자열 | Production |

> **중요**: `SUPABASE_SERVICE_ROLE_KEY`에는 `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다!

### 5-3. Vercel 도메인 설정

1. **Settings > Domains**에서 커스텀 도메인 추가 가능
2. 기본 도메인: `project-name.vercel.app`
3. 도메인 설정 후 **Supabase Dashboard > Authentication > URL Configuration**에도 반영:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/**`

### 5-4. 배포 흐름

```
GitHub Push → Vercel 자동 빌드 → 배포 완료
  ├── main/master 브랜치 → Production 배포
  └── 기타 브랜치 → Preview 배포 (PR별 고유 URL)
```

- Vercel은 GitHub에 push할 때마다 자동으로 빌드/배포합니다
- PR을 만들면 Preview URL이 자동 생성됩니다
- 별도의 CI/CD 파이프라인 설정이 필요 없습니다

---

## 6. GitHub Actions 설정

### 6-1. Keep-Alive 워크플로우

Supabase Free Tier 프로젝트 일시정지를 방지합니다.

#### `.github/workflows/keep-alive.yml`

```yaml
name: Supabase Keep-Alive

on:
  schedule:
    # 3일마다 실행 (UTC 기준 00:00)
    - cron: '0 0 */3 * *'
  workflow_dispatch: # 수동 실행 가능

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Supabase DB Keep-Alive 요청
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.SITE_URL }}/api/keep-alive")

          if [ "$response" -eq 200 ]; then
            echo "Keep-alive 성공 (HTTP $response)"
          else
            echo "Keep-alive 실패 (HTTP $response)"
            exit 1
          fi
```

### 6-2. GitHub Repository Secrets 설정

1. GitHub 리포지토리 > **Settings > Secrets and variables > Actions**
2. **New repository secret** 클릭
3. 다음 시크릿을 추가:

| Secret 이름 | 값 | 설명 |
|-------------|-----|------|
| `SITE_URL` | `https://your-app.vercel.app` | 배포된 사이트 URL (끝에 `/` 없이) |
| `CRON_SECRET` | `임의의 긴 문자열` | Keep-Alive API 인증 토큰 |

> **CRON_SECRET 생성 팁**: 터미널에서 `openssl rand -hex 32` 실행하면 랜덤 시크릿을 생성할 수 있습니다.

### 6-3. 워크플로우 확인 방법

1. GitHub 리포지토리 > **Actions** 탭
2. "Supabase Keep-Alive" 워크플로우 선택
3. **Run workflow** 버튼으로 수동 테스트 가능
4. 실행 기록에서 성공/실패 확인

### 6-4. Cron 스케줄 참고

```
┌───────────── 분 (0-59)
│ ┌───────────── 시 (0-23)
│ │ ┌───────────── 일 (1-31)
│ │ │ ┌───────────── 월 (1-12)
│ │ │ │ ┌───────────── 요일 (0-6, 일요일=0)
│ │ │ │ │
* * * * *

# 예시
'0 0 */3 * *'   → 3일마다 (UTC 00:00)
'0 9 * * 1'     → 매주 월요일 오전 9시 (UTC)
'0 0 1 * *'     → 매월 1일 자정 (UTC)
```

> GitHub Actions의 cron은 **UTC 기준**입니다. 한국 시간(KST)은 UTC+9입니다.

---

## 7. 환경변수 총정리

### 모든 환경에서 필요한 변수

| 변수명 | 설정 위치 | 공개 여부 | 설명 |
|--------|-----------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel, `.env.local` | 공개 (NEXT_PUBLIC) | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel, `.env.local` | 공개 (NEXT_PUBLIC) | Supabase Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel, `.env.local` | **비공개** | Supabase Service Role Key |
| `CRON_SECRET` | Vercel, GitHub Secrets | **비공개** | Keep-Alive API 인증 토큰 |
| `SITE_URL` | GitHub Secrets | **비공개** | 배포된 사이트 URL |

### 로컬 개발용 `.env.local` 예시

```env
# Supabase (Supabase Dashboard > Settings > API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep-Alive (선택사항 - 로컬에서는 없어도 됨)
CRON_SECRET=your-secret-token-here
```

> `.env.local`은 `.gitignore`에 포함되어 있어야 합니다 (Next.js 기본 설정).

### 설정 위치 매핑

```
┌─────────────────────────────────────────────────┐
│              환경변수 설정 위치                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  로컬 개발    → .env.local 파일                   │
│  Vercel 배포  → Vercel Dashboard > Settings      │
│                 > Environment Variables          │
│  GitHub Actions → GitHub > Settings > Secrets    │
│                   and variables > Actions        │
│                                                  │
│  ⚠ 3곳 모두 동일한 CRON_SECRET 값을 사용해야 함    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 8. 체크리스트

### Supabase 설정 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 리전 선택 (Tokyo 추천)
- [ ] SQL Editor에서 테이블 생성
- [ ] RLS 활성화 및 정책 생성
- [ ] Storage 버킷 생성 및 정책 설정
- [ ] Authentication > Providers > Email 활성화
- [ ] Authentication > URL Configuration > Site URL 설정
- [ ] Authentication > URL Configuration > Redirect URLs 설정
- [ ] "Confirm email" 설정 확인 (내부 앱이면 비활성화)

### Vercel 설정 체크리스트

- [ ] GitHub 리포지토리 Import
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 환경변수 추가
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 추가
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 환경변수 추가
- [ ] `CRON_SECRET` 환경변수 추가
- [ ] 배포 확인 (자동 빌드)
- [ ] 커스텀 도메인 설정 (선택사항)

### GitHub Actions 설정 체크리스트

- [ ] `.github/workflows/keep-alive.yml` 파일 생성
- [ ] `app/api/keep-alive/route.ts` API 엔드포인트 생성
- [ ] GitHub Secrets에 `SITE_URL` 추가
- [ ] GitHub Secrets에 `CRON_SECRET` 추가 (Vercel과 동일한 값)
- [ ] Actions 탭에서 수동 실행(Run workflow)으로 테스트
- [ ] 3일 후 자동 실행 기록 확인

### 보안 체크리스트

- [ ] `SUPABASE_SERVICE_ROLE_KEY`에 `NEXT_PUBLIC_` 접두사 안 붙였는지 확인
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인
- [ ] 관리자 기능은 서버 측(API Route)에서만 Service Role Key 사용
- [ ] 모든 테이블에 RLS 활성화 확인
- [ ] Storage 버킷에 RLS 정책 설정 확인
- [ ] 기본 관리자 비밀번호 운영 환경에서 변경

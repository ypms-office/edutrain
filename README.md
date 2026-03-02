# 🎓 EduTrain 관리 시스템

교사 전문성 개발 및 연수 관리를 위한 종합 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

## 📋 목차

- [기능 소개](#-기능-소개)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [프로젝트 구조](#-프로젝트-구조)
- [페이지 구조](#-페이지-구조)
- [배포 가이드](#-배포-가이드)
- [환경 변수](#-환경-변수)
- [개발 가이드](#-개발-가이드)

## ✨ 기능 소개

### 교사 기능
- ✅ **회원가입/로그인**: 이메일 기반 인증 시스템
- 📊 **개인 대시보드**: 실시간 통계 (총 이수시간, 목표 달성률, 이수증 현황)
- 📝 **연수 관리**: 등록, 수정, 삭제 (마스터 데이터 활용)
- 🔍 **연수 검색**: 연수명/기관명 검색 및 구분별 필터링
- 📄 **이수증 관리**: 업로드(드래그 앤 드롭), 다운로드, 미리보기, 삭제
- 📈 **페이지네이션**: 10개씩 나눠보기

### 관리자 기능
- 🔐 **관리자 인증**: 비밀번호 기반 접근 제어
- 📊 **통합 대시보드**: 전체 교사 통계 (이수시간 달성률, 이수증 등록률)
- 👥 **교사별 상세**: 개별 교사 연수 내역 및 통계
- 📥 **엑셀 다운로드**: 전체/이수증 미등록/기간별 데이터 추출
- ⚙️ **마스터 데이터 관리**: 연수명/기관명 CRUD 및 순서 변경
- 👤 **회원 관리**: 사용자 조회, 비밀번호 재설정, 삭제

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4, Pretendard 폰트
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Libraries**: xlsx (엑셀 생성), @supabase/ssr
- **Deployment**: Vercel (권장)

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

#### 2.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 웹사이트 방문
2. 새 프로젝트 생성
   - Project name: `edutrain-management`
   - Region: Seoul (ap-northeast-2)
   - 비밀번호 설정

#### 2.2 API 키 가져오기

1. Project Settings → API로 이동
2. 다음 정보 복사 및 **안전하게 보관**:
   - Project URL
   - `anon` public key
   - `service_role` key (⚠️ **절대 노출 금지**)

#### 2.3 환경 변수 설정 (로컬 개발용)

로컬 개발 시에만 `.env.local` 파일 생성 (선택사항):

```bash
# .env.local (로컬 개발용만, git에 커밋하지 마세요!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **중요**:
- `.env.local` 파일은 자동으로 git에서 제외됩니다 (`.gitignore`)
- **프로덕션 배포 시에는 Vercel 환경변수를 사용하세요**
- `.env.example` 파일을 참고하세요 (템플릿용)

#### 2.4 데이터베이스 구축

1. Supabase Dashboard → SQL Editor로 이동
2. `supabase-schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 실행 (Run)
4. 6개 테이블과 기본 데이터 생성 확인

#### 2.5 Storage 설정

1. Storage → Create new bucket
   - Name: `certificates`
   - Public bucket: **OFF** (Private)
   - File size limit: 5MB
   - Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

2. `supabase-storage.sql` 파일 내용을 SQL Editor에서 실행
3. 3개의 Storage 정책 생성 확인

#### 2.6 Authentication 설정

1. Authentication → Providers로 이동
2. Email provider 활성화
3. Confirm email: **OFF** (이메일 인증 비활성화)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 4. 빌드

```bash
npm run build
```

## 📁 프로젝트 구조

```
edutrain-management/
├── app/                           # Next.js App Router
│   ├── admin/                     # 관리자 페이지
│   │   ├── dashboard/             # 관리자 대시보드
│   │   ├── export/                # 데이터 엑셀 다운로드
│   │   ├── master-data/           # 마스터 데이터 관리
│   │   ├── teacher/[id]/          # 교사별 상세 통계
│   │   ├── users/                 # 회원 관리
│   │   ├── layout.tsx             # 관리자 레이아웃
│   │   └── page.tsx               # 관리자 로그인
│   ├── components/                # 공통 컴포넌트
│   │   ├── Header.tsx             # 헤더 컴포넌트
│   │   └── TrainingsList.tsx      # 연수 목록 테이블
│   ├── dashboard/                 # 개인 대시보드
│   ├── login/                     # 로그인 페이지
│   ├── signup/                    # 회원가입 페이지
│   ├── trainings/                 # 연수 관리
│   │   ├── [id]/certificate/      # 이수증 관리
│   │   ├── [id]/edit/             # 연수 수정
│   │   └── new/                   # 연수 등록
│   ├── globals.css                # 전역 스타일
│   ├── layout.tsx                 # 루트 레이아웃
│   └── page.tsx                   # 홈 (로그인으로 리다이렉트)
├── lib/                           # 유틸리티
│   ├── supabase/                  # Supabase 클라이언트
│   │   ├── client.ts              # 브라우저 클라이언트
│   │   ├── server.ts              # 서버 클라이언트
│   │   └── middleware.ts          # 미들웨어 클라이언트
│   └── uploadHelpers.ts           # 파일 업로드 유틸
├── docs/                          # 프로젝트 문서
│   ├── PRD.txt                    # 제품 요구사항
│   ├── 기능명세서.txt              # 기능 상세 명세
│   ├── UIUX 디자인 명세서.txt      # UI/UX 가이드
│   └── 개발 To-Do 리스트.txt       # 개발 가이드
├── middleware.ts                  # 인증 미들웨어
├── supabase-schema.sql            # DB 스키마
├── supabase-storage.sql           # Storage 정책
├── tailwind.config.ts             # Tailwind 설정
├── next.config.ts                 # Next.js 설정
└── package.json                   # 의존성
```

## 🗺️ 페이지 구조

### 공개 페이지
- `/` - 홈 (로그인으로 자동 리다이렉트)
- `/login` - 로그인
- `/signup` - 회원가입

### 교사 페이지 (인증 필요)
- `/dashboard` - 개인 대시보드 (통계 카드 + 연수 목록)
- `/trainings/new` - 연수 등록
- `/trainings/[id]/edit` - 연수 수정
- `/trainings/[id]/certificate` - 이수증 관리

### 관리자 페이지 (관리자 인증 필요)
- `/admin` - 관리자 로그인
- `/admin/dashboard` - 교사별 통계 대시보드
- `/admin/teacher/[id]` - 교사 상세 통계
- `/admin/export` - 데이터 엑셀 다운로드
- `/admin/master-data` - 마스터 데이터 관리
- `/admin/users` - 회원 관리

## 데이터베이스 스키마

- `users` - 교사 정보
- `trainings` - 연수 정보
- `certificates` - 이수증 파일 메타데이터
- `master_training_names` - 연수명 마스터 데이터 (12개 기본값)
- `master_institutions` - 기관명 마스터 데이터 (6개 기본값)
- `admin_config` - 관리자 설정 (기본 비밀번호: admin1234)

## 주요 기능

### 교사 기능
- 연수 등록/수정/삭제
- 이수증 업로드/다운로드
- 개인 대시보드 (총 이수시간, 목표 달성률, 이수증 현황)
- 연수 목록 조회 (검색, 필터, 페이지네이션)

### 관리자 기능
- 전체 교사 연수 현황 통계
- 교사별 상세 연수 내역 조회
- 연수 데이터 엑셀 다운로드
- 연수명/기관명 마스터 데이터 관리
- 회원 관리 (비밀번호 재설정, 삭제)

## 보안

- Row Level Security (RLS) 활성화
- 사용자별 데이터 접근 제어
- Storage 파일 접근 제어
- 환경 변수 관리 (.env.local은 git에 커밋하지 않음)

## 🚀 배포 가이드

### Vercel 배포 (권장)

1. **GitHub 저장소 푸시**
   ```bash
   git push origin main
   ```

2. **Vercel 프로젝트 생성**
   - [Vercel](https://vercel.com) 로그인
   - "Import Project" → GitHub 저장소 선택
   - Framework Preset: **Next.js** (자동 감지됨)

3. **🔐 환경 변수 설정 (중요!)**
   - Vercel Dashboard → Settings → **Environment Variables**
   - 아래 변수들을 **Vercel에 직접 입력**하세요:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (Supabase anon key) | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` (⚠️ 비공개 키) | Production, Preview, Development |
   | `JWT_SECRET` | 랜덤 문자열 (32자 이상) | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |

   ⚠️ **보안 주의사항**:
   - `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
   - 모든 환경 (Production, Preview, Development)에 체크 필수
   - `.env` 파일은 git에 커밋하지 마세요 (자동 제외됨)

4. **배포**
   - "Deploy" 버튼 클릭
   - 자동으로 빌드 및 배포 진행
   - 배포 URL 확인 (예: `https://edutrain-management.vercel.app`)

5. **자동 배포 설정**
   - main 브랜치에 푸시하면 자동 재배포
   - Preview 배포: PR 생성 시 자동으로 미리보기 URL 생성

### 수동 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 서버 실행
npm run start
```

## 🔐 환경 변수

### Vercel 환경변수 (프로덕션 배포)

프로덕션 배포 시 **Vercel Dashboard**에서 직접 설정:

| 변수명 | 설명 | 예시 | 공개 여부 |
|--------|------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://abc123.supabase.co` | 공개 (브라우저 노출) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | `eyJhbGc...` | 공개 (브라우저 노출) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | `eyJhbGc...` | ⚠️ **비공개** (서버 전용) |
| `JWT_SECRET` | JWT 토큰 시크릿 | `random-32-chars` | 비공개 |
| `NEXT_PUBLIC_APP_URL` | 배포 URL | `https://your-app.vercel.app` | 공개 |

### 로컬 개발용 환경변수 (선택사항)

로컬 개발 시에만 `.env.local` 파일 사용 (git에 **절대 커밋하지 마세요**):

```bash
# .env.local (로컬 개발용만!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-key-123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

📝 **참고**: `.env.example` 파일을 복사하여 사용하세요.

⚠️ **보안 주의사항**:
- `.env.local`, `.env` 파일은 `.gitignore`로 자동 제외됩니다
- **프로덕션에서는 반드시 Vercel 환경변수를 사용하세요**
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용됩니다
- 환경변수를 코드에 하드코딩하지 마세요

## 📝 개발 가이드

자세한 개발 가이드는 `docs/` 폴더의 문서를 참고하세요:
- **PRD.txt** - 제품 요구사항 문서
- **기능명세서.txt** - 기능 상세 명세 및 API 설계
- **UIUX 디자인 명세서.txt** - UI/UX 디자인 가이드 및 컴포넌트
- **개발 To-Do 리스트.txt** - 20단계 개발 로드맵

## 🧪 테스트

```bash
# 타입 체크
npx tsc --noEmit

# 빌드 테스트
npm run build

# 린트
npm run lint
```

## 📊 주요 통계

- **총 라인 수**: ~6,000+ 라인
- **페이지 수**: 15개
- **컴포넌트 수**: 20+개
- **데이터베이스 테이블**: 6개
- **API 라우트**: Supabase Functions 활용

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 👨‍💻 만든이

Claude Code - AI 기반 풀스택 개발

## 📞 문의

프로젝트 관련 문의사항은 Issue를 등록해주세요.

---

**Made with ❤️ using Next.js, Supabase, and Tailwind CSS**

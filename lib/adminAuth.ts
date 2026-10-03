/**
 * 관리자 인증 (서버 전용)
 *
 * 관리자 비밀번호는 서버에서만 확인하고, 통과하면 서명된 httpOnly 쿠키를 발급한다.
 * /api/admin/* 라우트는 모두 requireAdmin()으로 이 쿠키를 검사한다.
 *
 * 예전에는 브라우저가 admin_config 테이블을 직접 읽어 비밀번호를 비교했다.
 * 그 구조에서는 누구나 anon 키로 비밀번호를 읽을 수 있었다.
 */
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'edutrain_admin'
const SESSION_HOURS = 12

function getSecret(): string {
  // 별도 비밀키가 없으면 서비스 롤 키로 서명한다 (서버에만 있는 값)
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY')
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

/** 길이가 달라도 비교 시간이 일정한 문자열 비교 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function createAdminToken(): string {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000
  const payload = `admin.${expiresAt}`
  return `${payload}.${sign(payload)}`
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false

  const [role, expiresAtText, signature] = token.split('.')
  if (role !== 'admin' || !expiresAtText || !signature) return false

  const expiresAt = Number(expiresAtText)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  return safeEqual(signature, sign(`${role}.${expiresAtText}`))
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_HOURS * 60 * 60,
}

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)
}

/**
 * 관리자 쿠키가 없으면 401 응답을, 있으면 null을 돌려준다.
 *
 *   const unauthorized = await requireAdmin()
 *   if (unauthorized) return unauthorized
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminRequest()) return null
  return NextResponse.json(
    { error: '관리자 인증이 필요합니다.' },
    { status: 401 }
  )
}

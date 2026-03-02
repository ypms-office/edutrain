/**
 * 인증 관련 헬퍼 함수
 */

/**
 * 이름을 내부 이메일 형식으로 변환
 * Supabase Auth는 이메일을 필수로 요구하므로, 이름을 이메일 형식으로 변환합니다.
 * 한글 이름을 지원하기 위해 Base64 인코딩을 사용합니다.
 *
 * @param name - 사용자 이름 (예: "홍길동")
 * @returns 변환된 이메일 (예: "7ZmN6riY64-Z@internal.app")
 */
export function nameToEmail(name: string): string {
  // 공백 제거
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('이름을 입력해주세요.')
  }

  // 한글 이름을 Base64로 인코딩 (URL-safe)
  // Buffer를 사용하여 UTF-8 문자열을 Base64로 변환
  const encoded = Buffer.from(cleanName, 'utf-8')
    .toString('base64')
    // URL-safe Base64로 변환 (+를 -, /를 _로, =는 제거)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  // 내부 도메인을 사용하여 이메일 형식으로 변환
  return `${encoded}@internal.app`
}

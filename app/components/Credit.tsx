import { AUTHOR, AUTHOR_ORG, COPYRIGHT_MARK, PRODUCT, WARNING } from '@/lib/credit'

/**
 * 화면 맨 아래 제작자·저작권 표시.
 *
 * 교사 화면·관리자 화면의 마지막에 둔다. 두 줄이고, 두 줄의 무게가 다르다.
 *
 *   1. 만든 사람  — 13px, 진한 회색. 눈에 먼저 들어온다.
 *   2. 경고 문구  — 11.5px, 옅은 회색. 있되 물러나 있다.
 *
 * 둘을 같은 크기·같은 색으로 두면 화면 아래가 법률 고지처럼만 읽힌다. 매일
 * 이 화면을 보는 사람은 동료 선생님들이고, 형량 문구가 그분들 눈높이에 있을
 * 이유는 없다. 문구를 덜어내지 않고 위계만 준다 — 신문 판권란과 같은 방식이다.
 *
 * 문구는 lib/credit.ts 한 곳에서 온다. 이 프로그램이 다른 학교로 나가는 이상,
 * 출처 표시가 화면마다 다른 말로 적혀 있으면 안 된다.
 */
export function Credit({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <p className="text-[13px] leading-relaxed text-gray-600">
          {PRODUCT} &nbsp;기획·개발 {AUTHOR} ({AUTHOR_ORG}) &nbsp;{COPYRIGHT_MARK}
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-gray-400">{WARNING}</p>
      </div>
    </footer>
  )
}

/**
 * 로그인 화면처럼 가운데 정렬된 짧은 화면에 붙이는 것.
 * 본문이 짧은 화면이라 위 Credit보다 한 단계씩 작게 둔다.
 */
export function CreditLine({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-[12px] leading-relaxed text-gray-500">
        {PRODUCT} &nbsp;기획·개발 {AUTHOR} ({AUTHOR_ORG}) &nbsp;{COPYRIGHT_MARK}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{WARNING}</p>
    </div>
  )
}

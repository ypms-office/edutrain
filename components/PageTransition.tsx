'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle'>('enter')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setTransitionStage('enter')
      return
    }

    // New page content arrived
    setTransitionStage('enter')
    setDisplayChildren(children)
  }, [pathname, children])

  return (
    <div
      className={transitionStage === 'enter' ? 'animate-page-enter' : ''}
      onAnimationEnd={() => setTransitionStage('idle')}
    >
      {displayChildren}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSetNavigating } from './NavigationLoadingContext'

export default function GlobalLoadingOverlay() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const setNavigating = useSetNavigating()
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setIsVisible(true)
    setProgress(0)
    setNavigating(true)

    // Simulate progress - starts fast, slows down (native app feel)
    let currentProgress = 0
    if (progressRef.current) clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      currentProgress += (100 - currentProgress) * 0.15
      if (currentProgress >= 90) {
        currentProgress = 90
      }
      setProgress(currentProgress)
    }, 50)
  }, [setNavigating])

  const finishLoading = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }

    // Complete the progress bar
    setProgress(100)

    // Then fade out
    setTimeout(() => {
      setIsLoading(false)
      setNavigating(false)
    }, 150)

    setTimeout(() => {
      setIsVisible(false)
      setProgress(0)
    }, 400)
  }, [setNavigating])

  useEffect(() => {
    startLoading()

    const timer = setTimeout(() => {
      finishLoading()
    }, 300)

    return () => {
      clearTimeout(timer)
      if (progressRef.current) {
        clearInterval(progressRef.current)
        progressRef.current = null
      }
    }
  }, [pathname, startLoading, finishLoading])

  const handlePopState = useCallback(() => {
    startLoading()
    setTimeout(() => {
      finishLoading()
    }, 300)
  }, [startLoading, finishLoading])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handlePopState])

  if (!isVisible) return null

  return (
    <>
      {/* Top progress bar - iOS/Android style */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 shadow-sm"
          style={{
            width: `${progress}%`,
            transition: progress === 100
              ? 'width 0.15s ease-out, opacity 0.3s ease 0.15s'
              : 'width 0.05s linear',
            opacity: isLoading ? 1 : 0,
            boxShadow: '0 0 8px rgba(37, 99, 235, 0.4)',
          }}
        />
      </div>

      {/* Subtle page overlay - very light, quick fade */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          opacity: isLoading ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </>
  )
}

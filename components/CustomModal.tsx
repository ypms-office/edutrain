'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// ── Types ──────────────────────────────────────────────
type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm'

interface ModalOptions {
  type: ModalType
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ModalState extends ModalOptions {
  isOpen: boolean
  resolve?: (value: boolean) => void
}

interface ModalContextValue {
  alert: (message: string, type?: ModalType, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
}

// ── Context ────────────────────────────────────────────
const ModalContext = createContext<ModalContextValue | null>(null)

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

// ── Icons ──────────────────────────────────────────────
function SuccessIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function ErrorIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

function WarningIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  )
}

function InfoIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

function ConfirmIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-6 h-6 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  )
}

const iconMap: Record<ModalType, () => ReactNode> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  confirm: ConfirmIcon,
}

const defaultTitles: Record<ModalType, string> = {
  success: '완료',
  error: '오류',
  warning: '주의',
  info: '알림',
  confirm: '확인',
}

// ── Modal Component ────────────────────────────────────
function ModalDialog({ state, onClose }: { state: ModalState; onClose: (result: boolean) => void }) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const okBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state.isOpen) {
      // Focus the primary button on open
      const timer = setTimeout(() => {
        if (state.type === 'confirm') {
          confirmBtnRef.current?.focus()
        } else {
          okBtnRef.current?.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [state.isOpen, state.type])

  // Handle Escape key
  useEffect(() => {
    if (!state.isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state.isOpen, onClose])

  if (!state.isOpen) return null

  const Icon = iconMap[state.type]
  const title = state.title || defaultTitles[state.type]
  const isConfirm = state.type === 'confirm'

  const primaryBtnClass: Record<ModalType, string> = {
    success: 'bg-success-600 hover:bg-success-700 focus:ring-success-500',
    error: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
    warning: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
    info: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    confirm: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={() => onClose(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in overflow-hidden">
        {/* Body */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <Icon />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {state.message}
          </p>
        </div>

        {/* Footer */}
        <div className={`px-6 pb-6 ${isConfirm ? 'flex gap-3' : ''}`}>
          {isConfirm ? (
            <>
              <button
                onClick={() => onClose(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                {state.cancelText || '취소'}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => onClose(true)}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${primaryBtnClass[state.type]}`}
              >
                {state.confirmText || '확인'}
              </button>
            </>
          ) : (
            <button
              ref={okBtnRef}
              onClick={() => onClose(true)}
              className={`w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${primaryBtnClass[state.type]}`}
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Provider ───────────────────────────────────────────
const initialState: ModalState = {
  isOpen: false,
  type: 'info',
  message: '',
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>(initialState)

  const closeModal = useCallback((result: boolean) => {
    state.resolve?.(result)
    setState(initialState)
  }, [state.resolve])

  const showAlert = useCallback((message: string, type: ModalType = 'info', title?: string): Promise<void> => {
    return new Promise<boolean>((resolve) => {
      setState({ isOpen: true, type, message, title, resolve })
    }).then(() => {})
  }, [])

  const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ isOpen: true, type: 'confirm', message, title, resolve })
    })
  }, [])

  return (
    <ModalContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      <ModalDialog state={state} onClose={closeModal} />
    </ModalContext.Provider>
  )
}

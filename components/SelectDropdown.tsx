'use client'

import { useEffect, useId, useRef, useState } from 'react'

/**
 * 브라우저 기본 <select> 대신 쓰는 선택 상자.
 *
 * 기본 <select>는 펼쳐지는 목록을 브라우저가 직접 그려서, 아주 긴 항목
 * (예: 법정의무연수 묶음 과정명)이 있으면 목록이 화면 밖으로 넓어지고
 * 글자 앞부분이 잘린다. 여기서는 목록 폭을 입력칸과 같게 고정하고
 * 긴 이름은 줄바꿈해서 끝까지 보이게 한다.
 */

export interface SelectOption {
  value: string
  label: string
}

interface SelectDropdownProps {
  value: string
  options: SelectOption[]
  placeholder: string
  onChange: (value: string) => void
  required?: boolean
}

export default function SelectDropdown({
  value,
  options,
  placeholder,
  onChange,
  required,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selected = options.find(option => option.value === value)
  // 목록에 없는 값(예전에 저장된 연수명)도 그대로 보여 준다
  const displayLabel = selected?.label ?? value

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  // 키보드로 고른 항목이 보이도록 스크롤
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [isOpen, activeIndex])

  const open = () => {
    const index = options.findIndex(option => option.value === value)
    setActiveIndex(index >= 0 ? index : 0)
    setIsOpen(true)
  }

  const choose = (option: SelectOption) => {
    onChange(option.value)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        open()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (options[activeIndex]) choose(options[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
          isOpen ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'
        }`}
      >
        <span className={`min-w-0 [overflow-wrap:anywhere] ${displayLabel ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayLabel || placeholder}
        </span>
        <svg
          className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 브라우저 기본 "필수 입력" 안내를 유지하기 위한 숨은 입력칸 */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-x-0 bottom-0 h-px opacity-0 pointer-events-none"
        />
      )}

      {isOpen && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex
            return (
              <li
                key={`${index}-${option.value}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`px-4 py-3 cursor-pointer leading-snug [overflow-wrap:anywhere] ${
                  isActive ? 'bg-primary-50' : ''
                } ${isSelected ? 'text-primary-700 font-semibold' : 'text-gray-900'}`}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

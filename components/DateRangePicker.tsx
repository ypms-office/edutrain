'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
}

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function formatDateKR(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}.${m}.${day}`
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDateStr(s: string): Date | null {
  if (!s) return null
  return new Date(s + 'T00:00:00')
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getNextMonth(year: number, month: number) {
  if (month === 11) return { year: year + 1, month: 0 }
  return { year, month: month + 1 }
}

export default function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (startDate) {
      const d = parseDateStr(startDate)!
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const [selectionPhase, setSelectionPhase] = useState<'start' | 'end'>('start')
  const [tempStart, setTempStart] = useState(startDate)
  const [hoverDate, setHoverDate] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTempStart(startDate)
      setSelectionPhase(startDate && !endDate ? 'end' : 'start')
      if (startDate) {
        const d = parseDateStr(startDate)!
        setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() })
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() })
  }

  const handleDayClick = (dateStr: string) => {
    if (selectionPhase === 'start') {
      setTempStart(dateStr)
      onDateChange(dateStr, '')
      setSelectionPhase('end')
    } else {
      const clickedDate = parseDateStr(dateStr)!
      const start = parseDateStr(tempStart)!

      if (clickedDate < start) {
        setTempStart(dateStr)
        onDateChange(dateStr, '')
        setSelectionPhase('end')
      } else {
        onDateChange(tempStart, dateStr)
        setSelectionPhase('start')
        setIsOpen(false)
      }
    }
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const renderCalendarGrid = useCallback((year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const today = new Date()
    const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())

    const activeStart = selectionPhase === 'end' ? tempStart : startDate
    const activeEnd = selectionPhase === 'end' ? (hoverDate || endDate) : endDate

    const startObj = parseDateStr(activeStart)
    const endObj = parseDateStr(activeEnd)

    const cells: React.ReactNode[] = []

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-7" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateString(year, month, day)
      const dateObj = parseDateStr(dateStr)!

      const isToday = dateStr === todayStr
      const isStart = startObj && isSameDay(dateObj, startObj)
      const isEnd = endObj && isSameDay(dateObj, endObj)
      const isInRange = startObj && endObj && dateObj > startObj && dateObj < endObj
      const isSunday = dateObj.getDay() === 0
      const isSaturday = dateObj.getDay() === 6

      let cellClasses = 'relative h-8 flex items-center justify-center cursor-pointer transition-all duration-150 text-base font-medium rounded '

      if (isStart || isEnd) {
        cellClasses += 'bg-primary-600 text-white shadow-sm z-10 '
      } else if (isInRange) {
        cellClasses += 'bg-primary-600 text-white '
      } else if (isToday) {
        cellClasses += 'ring-1.5 ring-primary-400 text-primary-700 font-bold '
      } else if (isSunday) {
        cellClasses += 'text-danger-500 hover:bg-gray-100 '
      } else if (isSaturday) {
        cellClasses += 'text-primary-500 hover:bg-gray-100 '
      } else {
        cellClasses += 'text-gray-800 hover:bg-gray-100 '
      }

      let stripClass = ''
      if (isStart && endObj && !isSameDay(startObj!, endObj)) {
        stripClass = 'after:absolute after:right-0 after:top-0.5 after:bottom-0.5 after:w-1/2 after:bg-primary-600 after:-z-10 '
      } else if (isEnd && startObj && !isSameDay(startObj, endObj!)) {
        stripClass = 'before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1/2 before:bg-primary-600 before:-z-10 '
      }

      cells.push(
        <div
          key={dateStr}
          className={cellClasses + stripClass}
          onClick={() => handleDayClick(dateStr)}
          onMouseEnter={() => {
            if (selectionPhase === 'end' && tempStart) {
              setHoverDate(dateStr)
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${month + 1}월 ${day}일${isToday ? ' (오늘)' : ''}${isStart ? ' (시작일)' : ''}${isEnd ? ' (종료일)' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleDayClick(dateStr)
            }
          }}
        >
          {day}
          {isToday && !isStart && !isEnd && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
          )}
        </div>
      )
    }

    return cells
  }, [currentMonth, startDate, endDate, tempStart, selectionPhase, hoverDate])

  const displayText = () => {
    if (startDate && endDate) {
      return `${formatDateKR(startDate)}  ~  ${formatDateKR(endDate)}`
    }
    if (startDate && selectionPhase === 'end') {
      return `${formatDateKR(startDate)}  ~  종료일 선택`
    }
    return ''
  }

  const hasValue = startDate || endDate
  const nextMo = getNextMonth(currentMonth.year, currentMonth.month)

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        연수 기간 <span className="text-danger-600">*</span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${
          isOpen
            ? 'border-primary-500 ring-3 ring-primary-100 bg-white shadow-md'
            : hasValue
              ? 'border-gray-300 bg-white hover:border-primary-400 hover:shadow-sm'
              : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <svg className={`w-6 h-6 flex-shrink-0 ${hasValue ? 'text-primary-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {hasValue ? (
            <span className="text-base md:text-lg font-medium text-gray-900 truncate">
              {displayText()}
            </span>
          ) : (
            <span className="text-base md:text-lg text-gray-400">
              날짜를 선택하세요
            </span>
          )}
        </div>
        <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Selected dates summary */}
      {hasValue && !isOpen && (
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-primary-600" />
            <span className="text-gray-600">시작: <strong className="text-gray-900">{formatDateKR(startDate)}</strong></span>
          </div>
          {endDate && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-primary-600" />
                <span className="text-gray-600">종료: <strong className="text-gray-900">{formatDateKR(endDate)}</strong></span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Calendar Dropdown - 2 months */}
      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-scale-in"
          onMouseLeave={() => setHoverDate(null)}
        >
          {/* Selection Phase Indicator */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5 text-sm">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${selectionPhase === 'start' ? 'bg-primary-100 text-primary-700 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                시작일 {tempStart && selectionPhase === 'end' ? formatDateKR(tempStart) : '선택'}
              </div>
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${selectionPhase === 'end' ? 'bg-primary-100 text-primary-700 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                종료일 선택
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="이전 달"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">
                {currentMonth.year}년 {MONTHS_KO[currentMonth.month]} ~ {nextMo.year !== currentMonth.year ? `${nextMo.year}년 ` : ''}{MONTHS_KO[nextMo.month]}
              </span>
              <button
                type="button"
                onClick={goToToday}
                className="px-2 py-0.5 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors"
              >
                오늘
              </button>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="다음 달"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Two-month grid */}
          <div className="flex px-3 pb-2">
            {/* Left month */}
            <div className="flex-1">
              <div className="text-center text-sm font-semibold text-gray-600 mb-1">
                {MONTHS_KO[currentMonth.month]}
              </div>
              <div className="grid grid-cols-7">
                {DAYS_KO.map((day, i) => (
                  <div
                    key={`l-${day}`}
                    className={`h-7 flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'text-danger-500' : i === 6 ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {renderCalendarGrid(currentMonth.year, currentMonth.month)}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px bg-gray-200 mx-2 self-stretch" />

            {/* Right month */}
            <div className="flex-1">
              <div className="text-center text-sm font-semibold text-gray-600 mb-1">
                {nextMo.year !== currentMonth.year ? `${nextMo.year}년 ` : ''}{MONTHS_KO[nextMo.month]}
              </div>
              <div className="grid grid-cols-7">
                {DAYS_KO.map((day, i) => (
                  <div
                    key={`r-${day}`}
                    className={`h-7 flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'text-danger-500' : i === 6 ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {renderCalendarGrid(nextMo.year, nextMo.month)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDateChange('', '')
                setTempStart('')
                setSelectionPhase('start')
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Spinner component for loading states (Capsule design)
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeConfig = {
    sm: { container: 'w-12 h-12', bar: 'w-1 h-3' },
    md: { container: 'w-16 h-16', bar: 'w-1.5 h-5' },
    lg: { container: 'w-24 h-24', bar: 'w-2 h-7' }
  }

  const config = sizeConfig[size]

  return (
    <div className={`relative ${config.container} ${className}`}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className={`absolute ${config.container} flex items-start justify-center`}
          style={{ transform: `rotate(${i * 45}deg)` }}
        >
          <div
            className={`${config.bar} rounded-full`}
            style={{
              backgroundColor: '#4F46E5',
              opacity: 1 - i * 0.12,
              animation: `spinner-fade 1s ${i * 0.125}s infinite ease-in-out`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// Inline loading state for buttons
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
      </div>
    </div>
  )
}

'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

const NavigationLoadingContext = createContext(false)
const NavigationLoadingSetterContext = createContext<(v: boolean) => void>(() => {})

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)

  return (
    <NavigationLoadingContext.Provider value={isNavigating}>
      <NavigationLoadingSetterContext.Provider value={setIsNavigating}>
        {children}
      </NavigationLoadingSetterContext.Provider>
    </NavigationLoadingContext.Provider>
  )
}

export function useIsNavigating() {
  return useContext(NavigationLoadingContext)
}

export function useSetNavigating() {
  return useContext(NavigationLoadingSetterContext)
}

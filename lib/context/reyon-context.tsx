'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export const CURRENT_REYON_KEY = 'skt-current-reyon'

interface ReyonState {
  currentReyonId: string | null
  setCurrentReyonId: (id: string | null) => void
}

const ReyonContext = createContext<ReyonState | null>(null)

function readStoredReyonId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_REYON_KEY)
}

export function ReyonProvider({ children }: { children: ReactNode }) {
  const [currentReyonId, setCurrentReyonIdState] = useState<string | null>(() => readStoredReyonId())

  useEffect(() => {
    setCurrentReyonIdState(readStoredReyonId())
  }, [])

  const setCurrentReyonId = (id: string | null) => {
    setCurrentReyonIdState(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(CURRENT_REYON_KEY, id)
      else localStorage.removeItem(CURRENT_REYON_KEY)
    }
  }

  return (
    <ReyonContext.Provider value={{ currentReyonId, setCurrentReyonId }}>
      {children}
    </ReyonContext.Provider>
  )
}

export function useReyon() {
  const ctx = useContext(ReyonContext)
  if (!ctx) throw new Error('useReyon must be used within ReyonProvider')
  return ctx
}

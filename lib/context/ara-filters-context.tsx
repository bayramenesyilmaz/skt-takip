'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AraFiltersState {
  search: string
  setSearch: (v: string) => void
}

const AraFiltersContext = createContext<AraFiltersState | null>(null)

export function AraFiltersProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('')

  return (
    <AraFiltersContext.Provider value={{ search, setSearch }}>
      {children}
    </AraFiltersContext.Provider>
  )
}

export function useAraFilters() {
  const ctx = useContext(AraFiltersContext)
  if (!ctx) throw new Error('useAraFilters must be used within AraFiltersProvider')
  return ctx
}

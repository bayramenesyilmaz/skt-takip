'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AraFiltersState {
  search: string
  setSearch: (v: string) => void
  allReyons: boolean
  setAllReyons: (v: boolean) => void
}

const AraFiltersContext = createContext<AraFiltersState | null>(null)

export function AraFiltersProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('')
  const [allReyons, setAllReyons] = useState(false)

  return (
    <AraFiltersContext.Provider value={{ search, setSearch, allReyons, setAllReyons }}>
      {children}
    </AraFiltersContext.Provider>
  )
}

export function useAraFilters() {
  const ctx = useContext(AraFiltersContext)
  if (!ctx) throw new Error('useAraFilters must be used within AraFiltersProvider')
  return ctx
}

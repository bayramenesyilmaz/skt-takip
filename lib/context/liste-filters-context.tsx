'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ExpiryStatus } from '@/lib/types'
import { CURRENT_REYON_KEY } from '@/lib/context/reyon-context'

export type StatusFilter = 'all' | ExpiryStatus

interface ListeFiltersState {
  search: string
  setSearch: (v: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  brandFilter: string
  setBrandFilter: (v: string) => void
  categoryFilter: string
  setCategoryFilter: (v: string) => void
  reyonFilter: string
  setReyonFilter: (v: string) => void
}

const ListeFiltersContext = createContext<ListeFiltersState | null>(null)

function defaultReyonFilter(): string {
  if (typeof window === 'undefined') return 'current'
  return localStorage.getItem(CURRENT_REYON_KEY) ? 'current' : 'all'
}

export function ListeFiltersProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [reyonFilter, setReyonFilter] = useState(() => defaultReyonFilter())

  return (
    <ListeFiltersContext.Provider
      value={{ search, setSearch, statusFilter, setStatusFilter, brandFilter, setBrandFilter, categoryFilter, setCategoryFilter, reyonFilter, setReyonFilter }}
    >
      {children}
    </ListeFiltersContext.Provider>
  )
}

export function useListeFilters() {
  const ctx = useContext(ListeFiltersContext)
  if (!ctx) throw new Error('useListeFilters must be used within ListeFiltersProvider')
  return ctx
}

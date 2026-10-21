'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface BulkBarState {
  bulkBarActive: boolean
  setBulkBarActive: (v: boolean) => void
}

const BulkBarContext = createContext<BulkBarState | null>(null)

export function BulkBarProvider({ children }: { children: ReactNode }) {
  const [bulkBarActive, setBulkBarActive] = useState(false)

  return (
    <BulkBarContext.Provider value={{ bulkBarActive, setBulkBarActive }}>
      {children}
    </BulkBarContext.Provider>
  )
}

export function useBulkBar() {
  const ctx = useContext(BulkBarContext)
  if (!ctx) throw new Error('useBulkBar must be used within BulkBarProvider')
  return ctx
}

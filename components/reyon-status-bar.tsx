"use client"

import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { useAppData } from '@/hooks/use-app-data'
import { useReyon } from '@/lib/context/reyon-context'

export function ReyonStatusBar() {
  const { reyons } = useAppData()
  const { currentReyonId } = useReyon()

  if (reyons.length === 0) return null

  const currentReyon = reyons.find((r) => r.id === currentReyonId)

  return (
    <Link
      href="/app/reyonlar"
      className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-medium border-b border-primary/20"
    >
      <MapPin className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 truncate">{currentReyon ? currentReyon.name : 'Reyon secilmedi'}</span>
      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
    </Link>
  )
}

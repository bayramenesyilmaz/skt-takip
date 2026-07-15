'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>('supabase')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStorageMode(getStorageMode())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading) return
    if (storageMode === 'local') return
    if (!user) router.replace('/login')
  }, [user, loading, storageMode, mounted, router])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (storageMode === 'local') return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}

import type { IRepository } from '@/lib/repositories/repository.interface'
import { SupabaseRepository } from '@/lib/repositories/supabase-repository'
import { LocalRepository } from '@/lib/repositories/local-repository'

let cachedRepo: IRepository | null = null

export function getRepository(): IRepository {
  if (cachedRepo) return cachedRepo

  const mode = getStorageMode()
  if (mode === 'local') {
    cachedRepo = new LocalRepository()
  } else {
    cachedRepo = new SupabaseRepository()
  }
  return cachedRepo
}

export function getStorageMode(): 'supabase' | 'local' {
  if (typeof window === 'undefined') return 'supabase'
  try {
    return (localStorage.getItem('skt-storage-mode') as 'supabase' | 'local') || 'supabase'
  } catch {
    return 'supabase'
  }
}

export function setStorageMode(mode: 'supabase' | 'local'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('skt-storage-mode', mode)
  cachedRepo = null
}

export function resetRepositoryCache(): void {
  cachedRepo = null
}

import type { IRepository } from '@/lib/repositories/repository.interface'
import { LocalRepository } from '@/lib/repositories/local-repository'

let cachedRepo: IRepository | null = null

export function getRepository(): IRepository {
  if (!cachedRepo) cachedRepo = new LocalRepository()
  return cachedRepo
}

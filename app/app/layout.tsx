import type { ReactNode } from 'react'
import { ListeFiltersProvider } from '@/lib/context/liste-filters-context'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return <ListeFiltersProvider>{children}</ListeFiltersProvider>
}

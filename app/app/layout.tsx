import type { ReactNode } from 'react'
import { ListeFiltersProvider } from '@/lib/context/liste-filters-context'
import { AraFiltersProvider } from '@/lib/context/ara-filters-context'
import { QuickActionsFab } from '@/components/quick-actions-fab'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <ListeFiltersProvider>
      <AraFiltersProvider>
        {children}
        <QuickActionsFab />
      </AraFiltersProvider>
    </ListeFiltersProvider>
  )
}

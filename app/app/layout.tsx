import type { ReactNode } from 'react'
import { ReyonProvider } from '@/lib/context/reyon-context'
import { ListeFiltersProvider } from '@/lib/context/liste-filters-context'
import { AraFiltersProvider } from '@/lib/context/ara-filters-context'
import { QuickActionsFab } from '@/components/quick-actions-fab'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <ReyonProvider>
      <ListeFiltersProvider>
        <AraFiltersProvider>
          {children}
          <QuickActionsFab />
        </AraFiltersProvider>
      </ListeFiltersProvider>
    </ReyonProvider>
  )
}

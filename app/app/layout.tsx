import type { ReactNode } from 'react'
import { ReyonProvider } from '@/lib/context/reyon-context'
import { ListeFiltersProvider } from '@/lib/context/liste-filters-context'
import { AraFiltersProvider } from '@/lib/context/ara-filters-context'
import { QuickActionsFab } from '@/components/quick-actions-fab'
import { ReyonStatusBar } from '@/components/reyon-status-bar'
import { GlobalAdBanner } from '@/components/global-ad-banner'

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <ReyonProvider>
      <ListeFiltersProvider>
        <AraFiltersProvider>
          <ReyonStatusBar />
          {children}
          <GlobalAdBanner />
          <QuickActionsFab />
        </AraFiltersProvider>
      </ListeFiltersProvider>
    </ReyonProvider>
  )
}

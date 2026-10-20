"use client"

import { usePathname } from 'next/navigation'
import { ADS_ENABLED } from '@/lib/seo'
import { AdSlot } from '@/components/ad-slot'

// Urun detayi gibi alt navigasyonu olmayan sayfalarda banner en alta oturur;
// digerlerinde alt navigasyonun hemen ustunde durur.
const PAGES_WITHOUT_BOTTOM_NAV = ['/app/urun']

// Her /app sayfasinda (urun detayi dahil), sabit duran reklam banner'i.
// Sadece ADS_ENABLED acikken render edilir.
export function GlobalAdBanner() {
  const pathname = usePathname()
  if (!ADS_ENABLED) return null

  const hasBottomNav = !PAGES_WITHOUT_BOTTOM_NAV.some((p) => pathname?.startsWith(p))

  return (
    <div className={`fixed inset-x-0 z-30 px-4 pb-1 ${hasBottomNav ? 'bottom-16' : 'bottom-0'}`}>
      <div className="max-w-lg mx-auto">
        <AdSlot id="global-bottom-banner" />
      </div>
    </div>
  )
}

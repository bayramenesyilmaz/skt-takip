"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ADS_ENABLED } from '@/lib/seo'
import { AdSlot } from '@/components/ad-slot'

const DISMISSED_KEY = 'skt-ad-banner-dismissed'

// Urun detayi gibi alt navigasyonu olmayan sayfalarda banner en alta oturur;
// digerlerinde alt navigasyonun hemen ustunde durur.
const PAGES_WITHOUT_BOTTOM_NAV = ['/app/urun']

// Her /app sayfasinda (urun detayi dahil), sabit duran reklam banner'i.
// Sadece ADS_ENABLED acikken ve kullanici kapatmadiysa render edilir.
// Hizli islemler (FAB) butonuyla cakismamasi icin FAB daha yukarida durur.
export function GlobalAdBanner() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  if (!ADS_ENABLED || dismissed) return null

  const hasBottomNav = !PAGES_WITHOUT_BOTTOM_NAV.some((p) => pathname?.startsWith(p))

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className={`fixed inset-x-0 z-20 px-4 pb-1 ${hasBottomNav ? 'bottom-16' : 'bottom-0'}`}>
      <div className="max-w-lg mx-auto">
        <AdSlot id="global-bottom-banner" onClose={handleClose} />
      </div>
    </div>
  )
}

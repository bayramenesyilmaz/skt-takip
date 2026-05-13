"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { ProductItem } from '@/components/product-item'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { Package, AlertTriangle, Tag, Archive } from 'lucide-react'

export default function HomePage() {
  const { activeProducts, zeroStockProducts, setStockZero, isLoading } = useProductStore()

  const stats = useMemo(() => {
    if (!Array.isArray(activeProducts)) return { total: 0, critical: 0, campaign: 0, zero: 0 }
    
    let critical = 0
    let campaign = 0
    
    activeProducts.forEach(p => {
      const info = getExpiryInfoByType(p.expiryDate, p.productType)
      if (info.status === 'expired' || info.status === 'critical' || info.status === 'remove') {
        critical++
      } else if (info.status === 'campaign') {
        campaign++
      }
    })
    
    return {
      total: activeProducts.length,
      critical,
      campaign,
      zero: zeroStockProducts.length
    }
  }, [activeProducts, zeroStockProducts])

  const urgentProducts = useMemo(() => {
    if (!Array.isArray(activeProducts)) return []
    
    return activeProducts
      .filter(p => {
        const info = getExpiryInfoByType(p.expiryDate, p.productType)
        return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
        const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 5)
  }, [activeProducts])

  const campaignProducts = useMemo(() => {
    if (!Array.isArray(activeProducts)) return []
    
    return activeProducts
      .filter(p => {
        const info = getExpiryInfoByType(p.expiryDate, p.productType)
        return info.status === 'campaign'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
        const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 5)
  }, [activeProducts])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">SKT Takip</h1>
        <p className="text-sm opacity-80">Son kullanma tarihi yonetimi</p>
      </header>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/liste">
            <Card className="bg-slate-50 border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  <p className="text-xs text-slate-500">Toplam Urun</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/liste?filter=critical">
            <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
                  <p className="text-xs text-red-500">Acil Islem</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/rapor">
            <Card className="bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.campaign}</p>
                  <p className="text-xs text-blue-500">Kampanya</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/stok0">
            <Card className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">{stats.zero}</p>
                  <p className="text-xs text-gray-500">Stok 0</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {urgentProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Acil Islem Gereken</h2>
              <Link href="/liste?filter=critical" className="text-xs text-primary">
                Tumu
              </Link>
            </div>
            <div className="space-y-2">
              {urgentProducts.map(product => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onDelete={setStockZero}
                />
              ))}
            </div>
          </section>
        )}

        {campaignProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground">Kampanya Onerisi</h2>
              <Link href="/rapor" className="text-xs text-primary">
                Rapor Al
              </Link>
            </div>
            <div className="space-y-2">
              {campaignProducts.map(product => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onDelete={setStockZero}
                />
              ))}
            </div>
          </section>
        )}

        {activeProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Henuz urun yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Liste sayfasindan urun ekleyin
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

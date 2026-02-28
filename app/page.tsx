"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCardItem } from '@/components/product-card-item'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Package, AlertTriangle, ShoppingCart, ChevronRight } from 'lucide-react'

const statusConfig: Record<string, { bg: string; badge: string }> = {
  expired: { bg: 'bg-destructive/10', badge: 'bg-destructive' },
  critical: { bg: 'bg-destructive/5', badge: 'bg-destructive/90' },
  remove: { bg: 'bg-orange-500/10', badge: 'bg-orange-500' },
  campaign: { bg: 'bg-amber-500/10', badge: 'bg-amber-500' },
  safe: { bg: 'bg-emerald-500/10', badge: 'bg-emerald-500' },
}

export default function Home() {
  const { products } = useProductStore()

  // Acil urunler (expired + critical + remove)
  const urgentCount = useMemo(() => {
    return products.filter(p => {
      const info = getExpiryInfo(p.expiryDate)
      return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
    }).length
  }, [products])

  // Kampanya urunleri
  const campaignCount = useMemo(() => {
    return products.filter(p => getExpiryInfo(p.expiryDate).status === 'campaign').length
  }, [products])

  // 4-5 kritik/raftan kaldırılacak ürün
  const urgentProducts = useMemo(() => {
    return products
      .filter(p => {
        const info = getExpiryInfo(p.expiryDate)
        return (info.status === 'expired' || info.status === 'critical' || info.status === 'remove') && p.stockCode !== '0'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 5)
  }, [products])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">SKT Takip</h1>
              <p className="text-xs text-muted-foreground">Son Kullanma Tarihi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Basit Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-primary/5 border-0">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-foreground">{products.filter(p => p.stockCode !== '0').length}</p>
              <p className="text-xs text-muted-foreground">Ürün</p>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-0">
            <CardContent className="p-3">
              <p className="text-2xl font-bold text-destructive">{urgentCount}</p>
              <p className="text-xs text-muted-foreground">Acil</p>
            </CardContent>
          </Card>

          <Link href="/stok0" className="block">
            <Card className="bg-muted/50 border-0 hover:bg-muted transition-colors">
              <CardContent className="p-3">
                <p className="text-2xl font-bold text-muted-foreground">
                  {products.filter(p => p.stockCode === '0').length}
                </p>
                <p className="text-xs text-muted-foreground">Stok 0</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Kritik Ürünler */}
        {urgentProducts.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-sm font-semibold text-foreground px-2">
              Acil İşlem Gereken ({urgentProducts.length})
            </h2>
            {urgentProducts.map(product => (
              <ProductCardItem
                key={product.id}
                product={product}
                showActions={false}
              />
            ))}
          </div>
        )}

        {/* Menu Kartlari */}
        <div className="space-y-3 pt-4">
          <Link href="/liste">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Urunleri Goster</p>
                    <p className="text-xs text-muted-foreground">Ara, filtrele ve duzenle</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/rapor">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Kampanya Raporu</p>
                    <p className="text-xs text-muted-foreground">PDF indirme</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4">Henuz urun eklenmedi</p>
            <Link href="/ekle">
              <Button>Urun Ekle</Button>
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

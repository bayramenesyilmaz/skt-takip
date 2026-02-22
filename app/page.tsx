"use client"

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Package, AlertTriangle, ShoppingCart, ChevronRight } from 'lucide-react'

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
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5 border-0">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
              <p className="text-xs text-muted-foreground">Toplam Urun</p>
            </CardContent>
          </Card>
          
          {urgentCount > 0 && (
            <Card className="bg-destructive/5 border-0">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-destructive">{urgentCount}</p>
                <p className="text-xs text-muted-foreground">Acil Dikkat</p>
              </CardContent>
            </Card>
          )}
          
          {campaignCount > 0 && (
            <Card className="bg-amber-500/10 border-0">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-amber-600">{campaignCount}</p>
                <p className="text-xs text-muted-foreground">Kampanya</p>
              </CardContent>
            </Card>
          )}
        </div>

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

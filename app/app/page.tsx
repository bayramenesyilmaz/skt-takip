'use client'

import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, getThresholds, formatDate, statusConfig } from '@/lib/expiry'
import { StatsCards } from '@/components/stats-cards'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, RefreshCw, ScanBarcode, PackageX, ArrowRight, Clock, Package2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import type { ProductWithStock } from '@/lib/types'

export default function AppHomePage() {
  const { products, isLoading } = useAppData()

  const getEarliestStock = (p: ProductWithStock) => {
    const active = (p.stock_items || []).filter((s) => s.quantity > 0)
    if (active.length === 0) return null
    return [...active].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
  }

  const urgentProducts = useMemo(() => {
    return products
      .map((p) => ({ product: p, stock: getEarliestStock(p) }))
      .filter((x): x is { product: ProductWithStock; stock: NonNullable<ReturnType<typeof getEarliestStock>> } => !!x.stock)
      .map((x) => ({ ...x, expiry: getExpiryInfo(x.stock.expiry_date, getThresholds(x.product.shelf_life_type)) }))
      .filter((x) => ['expired', 'critical', 'remove'].includes(x.expiry.status))
      .sort((a, b) => a.expiry.daysLeft - b.expiry.daysLeft)
  }, [products])

  const missingBarcodeCount = useMemo(
    () => products.filter((p) => !p.barcode || !p.barcode.trim()).length,
    [products]
  )

  const zeroStockCount = useMemo(
    () => products.filter((p) => (p.total_quantity ?? 0) === 0).length,
    [products]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">SKT Takip</h1>
              <p className="text-xs text-muted-foreground">{products.length} urun kayitli</p>
            </div>
            <Link href="/app/import">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" /> Import
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <StatsCards products={products} />

        {missingBarcodeCount > 0 && (
          <Link href="/app/barkodsuz">
            <Card className="p-4 border-amber-500/30 bg-amber-500/5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <ScanBarcode className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{missingBarcodeCount} urunun barkodu eksik</p>
                    <p className="text-xs text-muted-foreground">Hizlica barkod ekleyerek tamamlayin</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        )}

        {zeroStockCount > 0 && (
          <Link href="/app/stok-sifir">
            <Card className="p-4 border-red-500/30 bg-red-500/5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <PackageX className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{zeroStockCount} urun stok sifir</p>
                    <p className="text-xs text-muted-foreground">SKT girerek geri getirin ya da kalici silin</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4" />Acil Urunler</h2>
              <Link href="/app/liste">
                <Button variant="ghost" size="sm">Tumunu Gor</Button>
              </Link>
            </div>
            {urgentProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Acil urun yok.</p>
            ) : (
              <div className="space-y-2">
                {urgentProducts.slice(0, 5).map(({ product, stock, expiry }) => (
                  <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(stock.expiry_date)} - {expiry.label}
                        </p>
                      </div>
                      <Badge className={`${statusConfig[expiry.status].badge} text-white shrink-0`}>
                        {expiry.daysLeft} gun
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </main>
  )
}

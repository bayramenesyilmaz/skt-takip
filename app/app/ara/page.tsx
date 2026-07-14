"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, statusConfig, formatDate } from '@/lib/expiry'
import { Search, MapPin, Clock, Camera, Package } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

export default function AraPage() {
  const { products, locations, isLoading, addProduct } = useAppData()
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return products
      .filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
      )
      .map(product => {
        const earliestStock = product.stock_items?.[0]
        const location = earliestStock?.location_id
          ? locations.find(l => l.id === earliestStock.location_id)
          : undefined
        const parentLocation = location?.parent_id
          ? locations.find(l => l.id === location.parent_id)
          : undefined
        const expiryInfo = earliestStock ? getExpiryInfo(earliestStock.expiry_date) : null

        return { product, location, parentLocation, expiryInfo }
      })
      .sort((a, b) => (a.expiryInfo?.daysLeft || 999) - (b.expiryInfo?.daysLeft || 999))
  }, [searchQuery, products, locations])

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode)
    setShowScanner(false)
  }

  const handleAddProduct = (product: Omit<ProductWithStock, 'id' | 'created_at' | 'updated_at'>) => {
    addProduct(product as any)
    setShowForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
  }

  if (showForm) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={handleAddProduct}
            onCancel={() => setShowForm(false)}
            locations={locations}
            brands={[]}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Ürün Ara</h1>
              <p className="text-xs text-muted-foreground">Nerede olduğunu bul</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı, stok kodu veya barkod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-muted/50"
                autoFocus
              />
            </div>
            <Button variant="secondary" className="h-11 px-3" onClick={() => setShowScanner(true)}>
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {searchQuery.trim() === '' ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Ürün Ara</h3>
            <p className="text-sm text-muted-foreground">
              Stok kodu, barkod veya ürün adıyla arayabilirsiniz
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Sonuç Bulunamadı</h3>
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" ile eşleşen ürün yok
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{searchResults.length} sonuç bulundu</p>
            {searchResults.map(({ product, location, parentLocation, expiryInfo }) => {
              const config = expiryInfo ? statusConfig[expiryInfo.status] : statusConfig.safe
              return (
                <Link key={product.id} href={`/app/urun/${product.id}`}>
                  <Card className={`${config.bg} border ${config.border} cursor-pointer hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
                          {expiryInfo && (
                            <Badge className={`${config.badge} text-white text-xs shrink-0`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {expiryInfo.label}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {product.stock_items?.[0] && (
                            <span>SKT: {formatDate(product.stock_items[0].expiry_date)}</span>
                          )}
                          {product.stock_code && <span>Stok: {product.stock_code}</span>}
                          {product.barcode && <span>Barkod: {product.barcode}</span>}
                        </div>
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${location ? 'bg-background/80' : 'bg-muted/50'}`}>
                          <MapPin className={`w-4 h-4 ${location ? 'text-primary' : 'text-muted-foreground'}`} />
                          {location ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {parentLocation && (
                                <>
                                  <span className="font-medium text-sm">{parentLocation.name}</span>
                                  <span className="text-muted-foreground">/</span>
                                </>
                              )}
                              <span className="font-medium text-sm">{location.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Lokasyon atanmamış</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { 
  Search, 
  MapPin, 
  Clock, 
  Camera,
  Package
} from 'lucide-react'
import type { Product, ExpiryStatus } from '@/lib/types'

const statusConfig: Record<ExpiryStatus, { bg: string; text: string; badge: string }> = {
  expired: { bg: 'bg-destructive/10', text: 'text-destructive', badge: 'bg-destructive' },
  critical: { bg: 'bg-destructive/5', text: 'text-destructive', badge: 'bg-destructive/90' },
  remove: { bg: 'bg-orange-500/10', text: 'text-orange-600', badge: 'bg-orange-500' },
  campaign: { bg: 'bg-amber-500/10', text: 'text-amber-600', badge: 'bg-amber-500' },
  safe: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', badge: 'bg-emerald-500' },
}

export default function AraPage() {
  const { products, locations, isLoading, addProduct } = useProductStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return products
      .filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
      )
      .map(product => ({
        product,
        location: product.locationId 
          ? locations.find(l => l.id === product.locationId) 
          : undefined,
        expiryInfo: getExpiryInfo(product.expiryDate)
      }))
      .sort((a, b) => a.expiryInfo.daysLeft - b.expiryInfo.daysLeft)
  }, [searchQuery, products, locations])

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode)
    setShowScanner(false)
  }

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
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
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Urun Ara</h1>
              <p className="text-xs text-muted-foreground">Nerede oldugunu bul</p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun adi, stok kodu veya barkod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-muted/50"
                autoFocus
              />
            </div>
            <Button 
              variant="secondary" 
              className="h-11 px-3"
              onClick={() => setShowScanner(true)}
            >
              <Camera className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Results */}
        {searchQuery.trim() === '' ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Ara</h3>
            <p className="text-sm text-muted-foreground">
              Stok kodu, barkod veya urun adiyla arayabilirsiniz
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Sonuc Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" ile eslesen urun yok
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {searchResults.length} sonuc bulundu
            </p>
            
            {searchResults.map(({ product, location, expiryInfo }) => {
              const config = statusConfig[expiryInfo.status]
              
              return (
                <Card key={product.id} className={`${config.bg} border`}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-sm">
                          {product.name}
                        </h3>
                        <Badge className={`${config.badge} text-white text-xs shrink-0`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {expiryInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>SKT: {formatDate(product.expiryDate)}</span>
                        {product.stockCode && (
                          <span>Stok: {product.stockCode}</span>
                        )}
                        {product.barcode && (
                          <span>Barkod: {product.barcode}</span>
                        )}
                      </div>
                      
                      {/* Location Info */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg ${location ? 'bg-background/80' : 'bg-muted/50'}`}>
                        <MapPin className={`w-4 h-4 ${location ? 'text-primary' : 'text-muted-foreground'}`} />
                        {location ? (
                          <div>
                            <span className="font-medium text-sm">{location.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({location.type})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Lokasyon atanmamis
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

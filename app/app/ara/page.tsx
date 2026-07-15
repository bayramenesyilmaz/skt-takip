'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, statusConfig, formatDate } from '@/lib/expiry'
import { Search, MapPin, Clock, Camera, Package, Layers } from 'lucide-react'
import type { ProductWithStock, Location } from '@/lib/types'

export default function AraPage() {
  const { products, locations, isLoading } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const results = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
      .map(product => {
        const stockWithLocs = (product.stock_items || []).map(s => ({
          stock: s,
          location: s.location_id ? locations.find(l => l.id === s.location_id) : undefined,
          parentLoc: s.location_id ? locations.find(l => l.id === locations.find(x => x.id === s.location_id)?.parent_id) : undefined,
        }))
        const earliest = stockWithLocs
          .sort((a, b) => new Date(a.stock.expiry_date).getTime() - new Date(b.stock.expiry_date).getTime())[0]
        return { product, stockWithLocs, earliest }
      })
      .sort((a, b) => {
        const aDate = a.earliest?.stock.expiry_date || '9999'
        const bDate = b.earliest?.stock.expiry_date || '9999'
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
  }, [searchQuery, products, locations])

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode)
    setShowScanner(false)
  }

  if (!mounted || isLoading) {
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

  const formatLoc = (loc: Location | undefined, parent: Location | undefined) => {
    if (!loc) return 'Lokasyon yok'
    const name = parent ? `${parent.name} / ${loc.name}` : loc.name
    return loc.type === 'palet' ? `${name} (Kat ${loc.level})` : name
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
              <h1 className="text-lg font-bold text-foreground">Urun Ara</h1>
              <p className="text-xs text-muted-foreground">Nerede oldugunu bul</p>
            </div>
          </div>

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
            <h3 className="font-semibold text-foreground mb-1">Urun Ara</h3>
            <p className="text-sm text-muted-foreground">
              Stok kodu, barkod veya urun adiyla arayabilirsiniz
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Barkod okuttugunuzda urunun tum lokasyonlari gosterilir
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Sonuc Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">"{searchQuery}" ile eslesen urun yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{results.length} sonuc bulundu</p>
            {results.map(({ product, stockWithLocs, earliest }) => {
              const info = earliest ? getExpiryInfo(earliest.stock.expiry_date) : null
              const config = info ? statusConfig[info.status] : statusConfig.safe
              const distinctLocs = new Set(stockWithLocs.map(s => s.stock.location_id).filter(Boolean))

              return (
                <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                  <Card className={`${config.bg} border ${config.border} cursor-pointer hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
                            {product.brand && (
                              <span className="text-xs text-muted-foreground">
                                {product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}
                              </span>
                            )}
                          </div>
                          {info && (
                            <Badge className={`${config.badge} text-white text-xs shrink-0`}>
                              <Clock className="w-3 h-3 mr-1" />{info.label}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {earliest?.stock && <span>SKT: {formatDate(earliest.stock.expiry_date)}</span>}
                          {product.stock_code && <span>Stok: {product.stock_code}</span>}
                          {product.barcode && <span>Barkod: {product.barcode}</span>}
                          <Badge variant="outline" className="text-xs">{distinctLocs.size} lokasyon</Badge>
                        </div>

                        {/* Show all locations */}
                        <div className="space-y-1.5">
                          {stockWithLocs.slice(0, 5).map(({ stock, location, parentLoc }, idx) => {
                            const sInfo = getExpiryInfo(stock.expiry_date)
                            const sConfig = statusConfig[sInfo.status]
                            return (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-background/80">
                                <MapPin className={`w-3.5 h-3.5 shrink-0 ${location ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="text-xs text-foreground flex-1 min-w-0 truncate">
                                  {formatLoc(location, parentLoc)}
                                </span>
                                <span className="text-xs text-muted-foreground">Adet: {stock.quantity}</span>
                                <Badge className={`${sConfig.badge} text-xs px-1.5 py-0`}>
                                  {sInfo.label}
                                </Badge>
                              </div>
                            )
                          })}
                          {stockWithLocs.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                              +{stockWithLocs.length - 5} lokasyon daha (detay sayfasinda)
                            </p>
                          )}
                        </div>

                        {info && info.status !== 'safe' && (
                          <p className={`text-xs font-medium ${config.text}`}>{info.actionRequired}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

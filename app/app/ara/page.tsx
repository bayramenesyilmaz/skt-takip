'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { ProductSearchCard } from '@/components/product-search-card'
import { useAppData } from '@/hooks/use-app-data'
import { getRepository } from '@/lib/repositories/repository.factory'
import { Search, Camera, Package } from 'lucide-react'

export default function AraPage() {
  const { products, isLoading } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [palletMap, setPalletMap] = useState<Record<string, { name: string; quantity: number }[]>>({})

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
        const sortedStock = [...(product.stock_items || [])]
          .filter((s) => s.quantity > 0)
          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
        return { product, sortedStock, earliest: sortedStock[0] }
      })
      .sort((a, b) => {
        const aDate = a.earliest?.expiry_date || '9999'
        const bDate = b.earliest?.expiry_date || '9999'
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
  }, [searchQuery, products])

  useEffect(() => {
    let cancelled = false
    if (results.length === 0) { setPalletMap({}); return }
    const repo = getRepository()
    Promise.all(results.map(async ({ product }) => {
      const items = await repo.getPalletItemsForProduct(product.id)
      return [product.id, items.map((i) => ({ name: i.pallet.name, quantity: i.quantity }))] as const
    })).then((entries) => {
      if (!cancelled) setPalletMap(Object.fromEntries(entries))
    })
    return () => { cancelled = true }
  }, [results])

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
              <p className="text-xs text-muted-foreground">Isim, stok kodu veya barkodla bul</p>
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
            {results.map(({ product }) => (
              <Link key={product.id} href={`/app/urun?id=${product.id}`} className="block hover:opacity-90 transition-opacity">
                <ProductSearchCard product={product} palletInfo={palletMap[product.id]} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

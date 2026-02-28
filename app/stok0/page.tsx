'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCardItem } from '@/components/product-card-item'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Search, X, ArrowLeft, Package } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function Stok0Page() {
  const { products, updateProduct } = useProductStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const zeroStockProducts = useMemo(() => {
    let filtered = products.filter(p => p.stockCode === '0')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }

    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfo(a.expiryDate)
      const bInfo = getExpiryInfo(b.expiryDate)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [products, searchQuery])

  const handleRestoreStock = (id: string) => {
    const product = products.find(p => p.id === id)
    if (product) {
      updateProduct(id, { ...product, stockCode: '1' })
      setShowConfirm(null)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <Link href="/liste">
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-foreground">Stok Sıfırı</h1>
          </div>

          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {zeroStockProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Stok 0 olan ürün yok</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-2 pb-2">
              {zeroStockProducts.length} ürün
            </p>
            {zeroStockProducts.map(product => (
              <div key={product.id} onClick={() => setShowConfirm(product.id)}>
                <ProductCardItem
                  product={product}
                  showActions
                  onDelete={() => setShowConfirm(product.id)}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Geri Getir Onayı */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Stok Geri Getir?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu ürünün stoku 1 yapılacak ve listeye geri dönecek.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(null)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => handleRestoreStock(showConfirm)}
                  className="flex-1"
                >
                  Devam Et
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav />
    </main>
  )
}

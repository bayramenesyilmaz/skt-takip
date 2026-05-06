'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCardItem } from '@/components/product-card-item'
import { ProductForm } from '@/components/product-form'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { Search, X, Camera } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function ListePage() {
  const { products = [], locations = [], updateProduct, reduceProductToZero } = useProductStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    let filtered = products.filter(p => p.stockCode !== '0')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getExpiryInfoByType(p.expiryDate, p.productType).status === statusFilter)
    }

    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
      const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [products, searchQuery, statusFilter])

  const handleEditSubmit = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product)
      setEditingProduct(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      reduceProductToZero(showDeleteConfirm)
      setShowDeleteConfirm(null)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">Ürünler</h1>
            <Link href="/stok0">
              <Badge variant="secondary" className="cursor-pointer">
                Stok 0: {products.filter(p => p.stockCode === '0').length}
              </Badge>
            </Link>
          </div>

          {/* Arama */}
          <div className="flex gap-2">
            <div className="relative flex-1">
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
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowScanner(!showScanner)}
              className="h-10 w-10"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {/* Filtreler */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tümü
            </button>
            {['expired', 'critical', 'remove', 'campaign', 'safe'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'expired' && 'Geçmiş'}
                {status === 'critical' && 'Kritik'}
                {status === 'remove' && 'Kaldır'}
                {status === 'campaign' && 'Kampanya'}
                {status === 'safe' && 'Güvenli'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Sonuç bulunamadı</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-2 pb-2">
              {filteredProducts.length} ürün
            </p>
            {filteredProducts.map(product => (
              <ProductCardItem
                key={product.id}
                product={product}
                showActions={false}
              />
            ))}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full max-w-lg bg-background p-4 rounded-t-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ürün Düzenle</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ProductForm
              initialData={editingProduct}
              locations={locations}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Ürünü Sil?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu ürünün stoku sıfırlanacak ve listede görünmeyecek.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="flex-1"
                >
                  Sil
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

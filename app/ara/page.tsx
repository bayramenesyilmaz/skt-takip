"use client"

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { ProductCard } from '@/components/product-card'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { useProductStore } from '@/hooks/use-product-store'
import { 
  Search, 
  Camera,
  Package
} from 'lucide-react'
import type { Product } from '@/lib/types'

export default function AraPage() {
  const { products, locations, isLoading, addProduct, updateProduct, reduceProductToZero } = useProductStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return products
      .filter(p => 
        (p.stockCode !== '0') && // Stok 0 olanları gösterme
        (p.name.toLowerCase().includes(query) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query)))
      )
      .map(product => ({
        product,
        locationName: (() => {
          const loc = locations.find(l => l.id === product.locationId)
          if (!loc) return undefined
          const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : undefined
          return parent ? `${parent.name} / ${loc.name}` : loc.name
        })()
      }))
  }, [searchQuery, products, locations])

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode)
    setShowScanner(false)
  }

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  const handleUpdateProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product)
      setEditingProduct(null)
    }
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

  if (showForm || editingProduct) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}
            initialData={editingProduct || undefined}
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
            
            {searchResults.map(({ product, locationName }) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={setEditingProduct}
                onDelete={() => reduceProductToZero(product.id)}
                onReduceToZero={reduceProductToZero}
                locationName={locationName}
                compact
                showStockButton
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

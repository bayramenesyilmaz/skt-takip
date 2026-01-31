"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/product-form'
import { ProductCard } from '@/components/product-card'
import { StatsCards } from '@/components/stats-cards'
import { EmptyState } from '@/components/empty-state'
import { InstallPrompt } from '@/components/install-prompt'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Package, ChevronRight, AlertTriangle, ClipboardPaste } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function Home() {
  const { 
    products, 
    locations,
    isLoading, 
    addProduct, 
    addBulkProducts, 
    updateProduct, 
    deleteProduct 
  } = useProductStore()
  
  const [showForm, setShowForm] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  // Acil urunler (expired + critical + remove) - ilk 5
  const urgentProducts = useMemo(() => {
    return products
      .filter(p => {
        const info = getExpiryInfo(p.expiryDate)
        return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 5)
  }, [products])

  // Kampanya urunleri - ilk 3
  const campaignProducts = useMemo(() => {
    return products
      .filter(p => getExpiryInfo(p.expiryDate).status === 'campaign')
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 3)
  }, [products])

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  const handleBulkAdd = (parsedProducts: import('@/lib/types').ParsedProduct[]) => {
    addBulkProducts(parsedProducts)
    setShowBulkAdd(false)
  }

  const handleUpdateProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product)
      setEditingProduct(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
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

  if (showBulkAdd) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <BulkProductAdd
            onAdd={handleBulkAdd}
            onCancel={() => setShowBulkAdd(false)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">SKT Takip</h1>
                <p className="text-xs text-muted-foreground">Son Kullanma Tarihi</p>
              </div>
            </div>
            <button
              onClick={() => setShowBulkAdd(true)}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title="Toplu Urun Ekle"
            >
              <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {products.length === 0 ? (
          <EmptyState onAddProduct={() => setShowForm(true)} />
        ) : (
          <>
            {/* Stats */}
            <StatsCards products={products} />

            {/* Acil Dikkat Gereken */}
            {urgentProducts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h2 className="font-semibold text-foreground text-sm">Acil Dikkat</h2>
                  </div>
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {products.filter(p => {
                      const info = getExpiryInfo(p.expiryDate)
                      return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
                    }).length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {urgentProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const product = products.find(p => p.id === id)
                        if (product) setDeleteTarget(product)
                      }}
                      locationName={locations.find(l => l.id === product.locationId)?.name}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Kampanya Onerisi */}
            {campaignProducts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground text-sm">Kampanya Onerisi</h2>
                  <Badge className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    {products.filter(p => getExpiryInfo(p.expiryDate).status === 'campaign').length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Yetkiliye bilgi verin - kampanya yapilabilir
                </p>
                <div className="space-y-2">
                  {campaignProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const product = products.find(p => p.id === id)
                        if (product) setDeleteTarget(product)
                      }}
                      locationName={locations.find(l => l.id === product.locationId)?.name}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Tum Urunleri Gor */}
            <Link href="/liste">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">Tum Urunleri Gor</p>
                    <p className="text-xs text-muted-foreground">
                      {products.length} urun listelendi
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />
      <InstallPrompt />
      
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

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
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo } from '@/lib/expiry'
import { Package, ChevronRight, AlertTriangle, ClipboardPaste, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode, setStorageMode, resetRepositoryCache } from '@/lib/repositories/repository.factory'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'

export default function AppHome() {
  const router = useRouter()
  const { profile, organization, signOut } = useAuth()
  const storageMode = getStorageMode()
  const {
    products,
    locations,
    brands,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useAppData()

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const canDelete = profile?.role === 'super_admin' || profile?.role === 'owner' || profile?.role === 'branch_manager' || storageMode === 'local'

  const urgentProducts = useMemo(() => {
    return products
      .filter((p) => {
        const earliestExpiry = p.stock_items?.[0]?.expiry_date
        if (!earliestExpiry) return false
        const info = getExpiryInfo(earliestExpiry)
        return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
      })
      .slice(0, 5)
  }, [products])

  const campaignProducts = useMemo(() => {
    return products
      .filter((p) => {
        const earliestExpiry = p.stock_items?.[0]?.expiry_date
        if (!earliestExpiry) return false
        const info = getExpiryInfo(earliestExpiry)
        return info.status === 'campaign'
      })
      .slice(0, 3)
  }, [products])

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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleSignOut = async () => {
    if (storageMode === 'local') {
      setStorageMode('supabase')
      resetRepositoryCache()
      router.push('/')
    } else {
      await signOut()
      router.push('/')
    }
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
            brands={brands}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">SKT Takip</h1>
                <p className="text-xs text-muted-foreground">
                  {organization?.name || 'Yerel Mod'}
                  {profile?.role && profile.role !== 'staff' && ` · ${profile.role}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app/import"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                title="Toplu Ekle"
              >
                <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
              </Link>
              <button
                onClick={handleSignOut}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                title="Çıkış"
              >
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {products.length === 0 ? (
          <EmptyState onAddProduct={() => setShowForm(true)} />
        ) : (
          <>
            <StatsCards products={products} />

            {urgentProducts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <h2 className="font-semibold text-foreground text-sm">Acil Dikkat</h2>
                  </div>
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {urgentProducts.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {urgentProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const p = products.find((p) => p.id === id)
                        if (p) setDeleteTarget(p)
                      }}
                      canDelete={canDelete}
                      locationName={(() => {
                        const loc = locations.find((l) => l.id === product.stock_items?.[0]?.location_id)
                        if (!loc) return undefined
                        const parent = loc.parent_id ? locations.find((l) => l.id === loc.parent_id) : undefined
                        return parent ? `${parent.name} / ${loc.name}` : loc.name
                      })()}
                    />
                  ))}
                </div>
              </section>
            )}

            {campaignProducts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-foreground text-sm">Kampanya Önerisi</h2>
                  <Badge className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    {campaignProducts.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Yetkiliye bilgi verin - kampanya yapılabilir
                </p>
                <div className="space-y-2">
                  {campaignProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const p = products.find((p) => p.id === id)
                        if (p) setDeleteTarget(p)
                      }}
                      canDelete={canDelete}
                      locationName={(() => {
                        const loc = locations.find((l) => l.id === product.stock_items?.[0]?.location_id)
                        if (!loc) return undefined
                        const parent = loc.parent_id ? locations.find((l) => l.id === loc.parent_id) : undefined
                        return parent ? `${parent.name} / ${loc.name}` : loc.name
                      })()}
                    />
                  ))}
                </div>
              </section>
            )}

            <Link href="/app/liste">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-dashed">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">Tüm Ürünleri Gör</p>
                    <p className="text-xs text-muted-foreground">
                      {products.length} ürün listelendi
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

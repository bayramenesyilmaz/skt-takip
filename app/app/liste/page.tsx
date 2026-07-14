"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/product-card'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { getExpiryInfo, statusConfig } from '@/lib/expiry'
import { Search, ListOrdered, Filter, Package } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { ProductWithStock, ExpiryStatus } from '@/lib/types'

type FilterStatus = 'all' | ExpiryStatus

export default function ListePage() {
  const { profile } = useAuth()
  const storageMode = getStorageMode()
  const canDelete = profile?.role === 'super_admin' || profile?.role === 'owner' || profile?.role === 'branch_manager' || storageMode === 'local'
  const { products, locations, isLoading, addProduct, updateProduct, deleteProduct } = useAppData()

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)

  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        const earliest = p.stock_items?.[0]?.expiry_date
        if (!earliest) return false
        return getExpiryInfo(earliest).status === statusFilter
      })
    }

    return filtered.sort((a, b) => {
      const aDate = a.stock_items?.[0]?.expiry_date || '9999'
      const bDate = b.stock_items?.[0]?.expiry_date || '9999'
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
  }, [products, searchQuery, statusFilter])

  const handleAddProduct = (product: Omit<ProductWithStock, 'id' | 'created_at' | 'updated_at'>) => {
    addProduct(product as any)
    setShowForm(false)
  }

  const handleUpdateProduct = (product: Omit<ProductWithStock, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product as any)
      setEditingProduct(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return products.length
    return products.filter(p => {
      const earliest = p.stock_items?.[0]?.expiry_date
      if (!earliest) return false
      return getExpiryInfo(earliest).status === status
    }).length
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
              <ListOrdered className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Tüm Ürünler</h1>
              <p className="text-xs text-muted-foreground">SKT sırasına göre</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {products.length}
            </Badge>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-muted/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-28 h-10 bg-muted/50">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="expired">Geçmiş</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="remove">Kaldır</SelectItem>
                <SelectItem value="campaign">Kampanya</SelectItem>
                <SelectItem value="safe">Güvenli</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'expired', 'critical', 'remove', 'campaign', 'safe'] as FilterStatus[]).map((s) => (
            <Badge
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              className="shrink-0 cursor-pointer text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Tümü' : statusConfig[s].label.split(' ')[0]} {getStatusCount(s)}
            </Badge>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Ürün Bulunamadı</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Filtrelere uyan ürün yok.'
                : 'Henüz ürün eklenmemiş.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/app/urun/${product.id}`}>
                <div>
                  <ProductCard
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
                    compact
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

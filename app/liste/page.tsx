"use client"

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/product-card'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Search, ListOrdered, Filter } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import type { Product, ExpiryStatus } from '@/lib/types'

type FilterStatus = 'all' | ExpiryStatus

export default function ListePage() {
  const { products, locations, isLoading, addProduct, updateProduct, deleteProduct } = useProductStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    let filtered = [...products]
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getExpiryInfo(p.expiryDate).status === statusFilter)
    }
    
    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfo(a.expiryDate)
      const bInfo = getExpiryInfo(b.expiryDate)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [products, searchQuery, statusFilter])

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

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return products.length
    return products.filter(p => getExpiryInfo(p.expiryDate).status === status).length
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

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Tum Urunler</h1>
              <p className="text-xs text-muted-foreground">SKT sirasina gore</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {products.length}
            </Badge>
          </div>
          
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun ara..."
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
                <SelectItem value="all">Tumu</SelectItem>
                <SelectItem value="expired">Gecmis</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="remove">Kaldir</SelectItem>
                <SelectItem value="campaign">Kampanya</SelectItem>
                <SelectItem value="safe">Guvenli</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3">
        {/* Quick Filters */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <Badge 
            variant={statusFilter === 'expired' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer text-xs"
            onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          >
            Gecmis {getStatusCount('expired')}
          </Badge>
          <Badge 
            variant={statusFilter === 'critical' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer text-xs"
            onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          >
            Kritik {getStatusCount('critical')}
          </Badge>
          <Badge 
            variant={statusFilter === 'remove' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer text-xs"
            onClick={() => setStatusFilter(statusFilter === 'remove' ? 'all' : 'remove')}
          >
            Kaldir {getStatusCount('remove')}
          </Badge>
          <Badge 
            variant={statusFilter === 'campaign' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer text-xs"
            onClick={() => setStatusFilter(statusFilter === 'campaign' ? 'all' : 'campaign')}
          >
            Kampanya {getStatusCount('campaign')}
          </Badge>
          <Badge 
            variant={statusFilter === 'safe' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer text-xs"
            onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')}
          >
            Guvenli {getStatusCount('safe')}
          </Badge>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ListOrdered className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Filtrelere uyan urun yok.'
                : 'Henuz urun eklenmemis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={setEditingProduct}
                onDelete={(id) => {
                  const product = products.find(p => p.id === id)
                  if (product) setDeleteTarget(product)
                }}
                locationName={locations.find(l => l.id === product.locationId)?.name}
                compact
              />
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

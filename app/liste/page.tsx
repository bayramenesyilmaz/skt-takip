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
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProductStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  // Sort and filter products by expiry date
  const filteredProducts = useMemo(() => {
    let filtered = [...products]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.stockCode.toLowerCase().includes(query) ||
        p.barcode.includes(query)
      )
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getExpiryInfo(p.expiryDate).status === statusFilter)
    }
    
    // Sort by expiry date (most urgent first)
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
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <ListOrdered className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tum Urunler</h1>
              <p className="text-xs text-muted-foreground">
                SKT sirasina gore listelendi
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {products.length} urun
            </Badge>
          </div>
          
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <SelectTrigger className="w-[130px] h-10 bg-muted/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Tumunu ({getStatusCount('all')})
                </SelectItem>
                <SelectItem value="expired">
                  Gecmis ({getStatusCount('expired')})
                </SelectItem>
                <SelectItem value="critical">
                  Kritik 0-3 gun ({getStatusCount('critical')})
                </SelectItem>
                <SelectItem value="remove">
                  Kaldir 4-14 gun ({getStatusCount('remove')})
                </SelectItem>
                <SelectItem value="campaign">
                  Kampanya 15-90 gun ({getStatusCount('campaign')})
                </SelectItem>
                <SelectItem value="safe">
                  Guvenli ({getStatusCount('safe')})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Product Count Summary */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <Badge 
            variant={statusFilter === 'expired' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
            onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          >
            Gecmis: {getStatusCount('expired')}
          </Badge>
          <Badge 
            variant={statusFilter === 'critical' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          >
            Kritik: {getStatusCount('critical')}
          </Badge>
          <Badge 
            variant={statusFilter === 'remove' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20"
            onClick={() => setStatusFilter(statusFilter === 'remove' ? 'all' : 'remove')}
          >
            Kaldir: {getStatusCount('remove')}
          </Badge>
          <Badge 
            variant={statusFilter === 'campaign' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
            onClick={() => setStatusFilter(statusFilter === 'campaign' ? 'all' : 'campaign')}
          >
            Kampanya: {getStatusCount('campaign')}
          </Badge>
          <Badge 
            variant={statusFilter === 'safe' ? 'default' : 'outline'}
            className="shrink-0 cursor-pointer bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
            onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')}
          >
            Guvenli: {getStatusCount('safe')}
          </Badge>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <ListOrdered className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Filtrelere uyan urun yok.'
                : 'Henuz urun eklenmemis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="relative">
                <div className="absolute -left-2 top-4 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <div className="pl-6">
                  <ProductCard
                    product={product}
                    onEdit={setEditingProduct}
                    onDelete={(id) => {
                      const product = products.find(p => p.id === id)
                      if (product) setDeleteTarget(product)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowForm(true)} />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

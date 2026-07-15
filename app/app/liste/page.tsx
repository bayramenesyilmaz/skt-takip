'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { getExpiryInfo, statusConfig } from '@/lib/expiry'
import { ProductCard } from '@/components/product-card'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ListOrdered, Filter, Package, Tag, ChevronRight } from 'lucide-react'
import type { ProductWithStock, ExpiryStatus } from '@/lib/types'

type StatusFilter = 'all' | ExpiryStatus

export default function ListePage() {
  const { profile } = useAuth()
  const { products, locations, brands, addProduct, updateProduct, deleteProduct } = useAppData()
  const [mounted, setMounted] = useState(false)
  const storageMode = getStorageMode()

  useEffect(() => { setMounted(true) }, [])

  const canDelete = profile?.role === 'super_admin' || profile?.role === 'owner' || profile?.role === 'branch_manager' || storageMode === 'local'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)

  const getEarliestExpiry = (p: ProductWithStock) => {
    if (!p.stock_items || p.stock_items.length === 0) return null
    return p.stock_items
      .map((s) => s.expiry_date)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
  }

  const filtered = useMemo(() => {
    let result = [...products]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }

    if (brandFilter !== 'all') {
      result = result.filter(p => p.brand_id === brandFilter)
    }

    if (locationFilter !== 'all') {
      result = result.filter(p =>
        p.stock_items?.some(s => s.location_id === locationFilter)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => {
        const earliest = getEarliestExpiry(p)
        if (!earliest) return false
        return getExpiryInfo(earliest).status === statusFilter
      })
    }

    return result.sort((a, b) => {
      const aDate = getEarliestExpiry(a) || '9999'
      const bDate = getEarliestExpiry(b) || '9999'
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
  }, [products, search, statusFilter, brandFilter, locationFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length, expired: 0, critical: 0, remove: 0, campaign: 0, safe: 0 }
    for (const p of products) {
      const earliest = getEarliestExpiry(p)
      if (earliest) {
        const info = getExpiryInfo(earliest)
        c[info.status]++
      }
    }
    return c
  }, [products])

  const handleFormSubmit = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
    } else {
      await addProduct(data)
    }
    setFormOpen(false)
    setEditingProduct(null)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tumu' },
    { key: 'expired', label: 'Gecti' },
    { key: 'critical', label: 'Kritik' },
    { key: 'remove', label: 'Kaldir' },
    { key: 'campaign', label: 'Kampanya' },
    { key: 'safe', label: 'Guvenli' },
  ]

  const getLocationName = (locId?: string) => {
    if (!locId) return undefined
    const loc = locations.find(l => l.id === locId)
    if (!loc) return undefined
    const parent = loc.parent_id ? locations.find(l => l.id === loc.parent_id) : undefined
    return parent ? `${parent.name} / ${loc.name}` : loc.name
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (formOpen) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={handleFormSubmit}
            onCancel={() => { setFormOpen(false); setEditingProduct(null) }}
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListOrdered className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Tum Urunler</h1>
              <p className="text-xs text-muted-foreground">SKT sirasina gore</p>
            </div>
            <Badge variant="secondary" className="text-xs">{products.length}</Badge>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Urun ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="h-9 bg-muted/50 flex-1">
                <Tag className="w-3.5 h-3.5 mr-1 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Markalar</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="h-9 bg-muted/50 flex-1">
                <Filter className="w-3.5 h-3.5 mr-1 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Lokasyonlar</SelectItem>
                {locations.map((l) => {
                  const parent = l.parent_id ? locations.find(p => p.id === l.parent_id) : undefined
                  return (
                    <SelectItem key={l.id} value={l.id}>
                      {parent ? `${parent.name} / ${l.name}` : l.name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}>
              <Badge
                variant={statusFilter === f.key ? 'default' : 'outline'}
                className="shrink-0 cursor-pointer text-xs"
              >
                {f.label} ({counts[f.key] || 0})
              </Badge>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' || brandFilter !== 'all' || locationFilter !== 'all'
                ? 'Filtrelere uyan urun yok.'
                : 'Henuz urun eklenmemis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                <ProductCard
                  product={product}
                  onEdit={(p) => { setEditingProduct(p); setFormOpen(true) }}
                  onDelete={(p) => setDeleteTarget(p)}
                  canDelete={canDelete}
                  locationName={getLocationName(product.stock_items?.[0]?.location_id)}
                  compact
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => { setEditingProduct(null); setFormOpen(true) }} />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

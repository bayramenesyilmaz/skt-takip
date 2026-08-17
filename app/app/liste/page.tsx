'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, getThresholds } from '@/lib/expiry'
import { ProductCard } from '@/components/product-card'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ListOrdered, Package, Tag, Thermometer, PackageX, ArrowRight, Camera, ListChecks, X } from 'lucide-react'
import type { ProductWithStock, ExpiryStatus } from '@/lib/types'

type StatusFilter = 'all' | ExpiryStatus

const VALID_FILTERS: StatusFilter[] = ['all', 'expired', 'critical', 'remove', 'campaign', 'safe']

function ListeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { products, brands, shelfLifeTypes, zeroProductStock, bulkAssignShelfLifeType } = useAppData()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [appliedInitialFilter, setAppliedInitialFilter] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCategory, setBulkCategory] = useState<string>('')
  const [applyingBulk, setApplyingBulk] = useState(false)

  useEffect(() => {
    if (appliedInitialFilter) return
    const f = searchParams.get('filter') as StatusFilter | null
    if (f && VALID_FILTERS.includes(f)) setStatusFilter(f)
    setAppliedInitialFilter(true)
  }, [searchParams, appliedInitialFilter])

  const getProductStatus = (p: ProductWithStock) => {
    const active = (p.stock_items || []).filter((s) => s.quantity > 0)
    if (active.length === 0) return null
    const earliest = active.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
    return { date: earliest.expiry_date, info: getExpiryInfo(earliest.expiry_date, getThresholds(p.shelf_life_type)) }
  }

  const activeProducts = useMemo(() => products.filter((p) => (p.total_quantity ?? 0) > 0), [products])
  const zeroStockCount = products.length - activeProducts.length

  const filtered = useMemo(() => {
    let result = [...activeProducts]

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

    if (categoryFilter === 'none') {
      result = result.filter(p => !p.shelf_life_type_id)
    } else if (categoryFilter !== 'all') {
      result = result.filter(p => p.shelf_life_type_id === categoryFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => getProductStatus(p)?.info.status === statusFilter)
    }

    return result.sort((a, b) => {
      const aDate = getProductStatus(a)?.date || '9999'
      const bDate = getProductStatus(b)?.date || '9999'
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
  }, [activeProducts, search, statusFilter, brandFilter, categoryFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: activeProducts.length, expired: 0, critical: 0, remove: 0, campaign: 0, safe: 0 }
    for (const p of activeProducts) {
      const status = getProductStatus(p)
      if (status) c[status.info.status]++
    }
    return c
  }, [activeProducts])

  const handleZeroStock = async () => {
    if (deleteTarget) {
      await zeroProductStock(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
    setBulkCategory('')
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))

  const toggleSelectAll = () => {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map((p) => p.id)))
  }

  const handleApplyBulkCategory = async () => {
    if (selectedIds.size === 0) return
    setApplyingBulk(true)
    try {
      await bulkAssignShelfLifeType(Array.from(selectedIds), bulkCategory || undefined)
      exitSelectMode()
    } finally {
      setApplyingBulk(false)
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showScanner) {
    return (
      <BarcodeScanner
        onScan={(barcode) => { setSearch(barcode); setShowScanner(false) }}
        onClose={() => setShowScanner(false)}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background pb-32">
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
            <Button
              variant={selectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? <X className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
            </Button>
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
            <Button variant="secondary" className="h-10 px-3" onClick={() => setShowScanner(true)}>
              <Camera className="w-4 h-4" />
            </Button>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 bg-muted/50 flex-1">
                <Thermometer className="w-3.5 h-3.5 mr-1 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Raf Omurleri</SelectItem>
                <SelectItem value="none">Kategorisiz</SelectItem>
                {shelfLifeTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3">
        {zeroStockCount > 0 && (
          <Link href="/app/stok-sifir">
            <Card className="p-3 mb-3 border-red-500/30 bg-red-500/5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PackageX className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-medium">{zeroStockCount} urun stok sifir</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        )}

        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button key={f.key} onClick={() => { setStatusFilter(f.key); router.replace('/app/liste') }}>
              <Badge
                variant={statusFilter === f.key ? 'default' : 'outline'}
                className="shrink-0 cursor-pointer text-xs"
              >
                {f.label} ({counts[f.key] || 0})
              </Badge>
            </button>
          ))}
        </div>

        {selectMode && filtered.length > 0 && (
          <label className="flex items-center gap-3 p-3 mb-2 rounded-lg border border-dashed border-border cursor-pointer">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-primary shrink-0"
            />
            <span className="text-sm font-medium text-foreground">
              {allFilteredSelected ? 'Tumunun secimini kaldir' : `Tumunu Sec (${filtered.length})`}
            </span>
          </label>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' || brandFilter !== 'all' || categoryFilter !== 'all'
                ? 'Filtrelere uyan urun yok.'
                : 'Henuz urun eklenmemis.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              selectMode ? (
                <label key={product.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelected(product.id)}
                    className="w-4 h-4 accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.shelf_life_type?.name || 'Kategorisiz'}</p>
                  </div>
                </label>
              ) : (
                <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                  <ProductCard
                    product={product}
                    onEdit={(p) => router.push(`/app/urun?id=${p.id}`)}
                    onDelete={() => setDeleteTarget(product)}
                    compact
                  />
                </Link>
              )
            ))}
          </div>
        )}
      </div>

      {selectMode && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">{selectedIds.size} secili</span>
            <Select value={bulkCategory || 'none'} onValueChange={(v) => setBulkCategory(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="Raf omru tipi sec" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kategorisiz yap</SelectItem>
                {shelfLifeTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-10" disabled={selectedIds.size === 0 || applyingBulk} onClick={handleApplyBulkCategory}>
              Uygula
            </Button>
          </div>
        </div>
      )}

      <BottomNav />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleZeroStock}
        productName={deleteTarget?.name || ''}
        title="Stogu Sifirla"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> urununun stogu sifirlanacak ve &quot;Stok Sifir&quot; listesine tasinacak. Oradan kalici olarak silebilir ya da yeni SKT girerek geri getirebilirsiniz.
          </>
        }
        confirmLabel="Stogu Sifirla"
      />
    </main>
  )
}

export default function ListePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ListeContent />
    </Suspense>
  )
}

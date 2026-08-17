'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo } from '@/lib/expiry'
import { ProductCard } from '@/components/product-card'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ListOrdered, Package, Tag, PackageX, ArrowRight, Camera } from 'lucide-react'
import type { ProductWithStock, ExpiryStatus } from '@/lib/types'

type StatusFilter = 'all' | ExpiryStatus

const VALID_FILTERS: StatusFilter[] = ['all', 'expired', 'critical', 'remove', 'campaign', 'safe']

function ListeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { products, brands, zeroProductStock } = useAppData()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [appliedInitialFilter, setAppliedInitialFilter] = useState(false)

  useEffect(() => {
    if (appliedInitialFilter) return
    const f = searchParams.get('filter') as StatusFilter | null
    if (f && VALID_FILTERS.includes(f)) setStatusFilter(f)
    setAppliedInitialFilter(true)
  }, [searchParams, appliedInitialFilter])

  const getEarliestExpiry = (p: ProductWithStock) => {
    const active = (p.stock_items || []).filter((s) => s.quantity > 0)
    if (active.length === 0) return null
    return active
      .map((s) => s.expiry_date)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
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
  }, [activeProducts, search, statusFilter, brandFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: activeProducts.length, expired: 0, critical: 0, remove: 0, campaign: 0, safe: 0 }
    for (const p of activeProducts) {
      const earliest = getEarliestExpiry(p)
      if (earliest) {
        const info = getExpiryInfo(earliest)
        c[info.status]++
      }
    }
    return c
  }, [activeProducts])

  const handleZeroStock = async () => {
    if (deleteTarget) {
      await zeroProductStock(deleteTarget.id)
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
            <Button variant="secondary" className="h-10 px-3" onClick={() => setShowScanner(true)}>
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-9 bg-muted/50 w-full">
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

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' || brandFilter !== 'all'
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
                  onEdit={(p) => router.push(`/app/urun?id=${p.id}`)}
                  onDelete={() => setDeleteTarget(product)}
                  compact
                />
              </Link>
            ))}
          </div>
        )}
      </div>

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

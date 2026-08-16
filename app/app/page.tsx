'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import {
  getStorageMode,
  setStorageMode,
  resetRepositoryCache,
} from '@/lib/repositories/repository.factory'
import { getExpiryInfo, formatDate, statusConfig } from '@/lib/expiry'
import { StatsCards } from '@/components/stats-cards'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Upload, RefreshCw, Zap, ScanLine, Barcode, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { ProductWithStock, StockItem } from '@/lib/types'

export default function AppHomePage() {
  const { profile, organization, signOut } = useAuth()
  const {
    products,
    locations,
    brands,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useAppData()

  const [storageMode, setStorageModeState] = useState<'supabase' | 'local'>(getStorageMode())
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)

  const missingBarcodeCount = useMemo(
    () => products.filter((p) => !p.barcode || p.barcode.trim() === '').length,
    [products],
  )

  // For each product, find the earliest-expiring stock item and surface urgent ones
  const urgentProducts = useMemo(() => {
    return products
      .map((p) => {
        const earliest = (p.stock_items || [])
          .slice()
          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0] as
          | StockItem
          | undefined
        return earliest ? { product: p, stock: earliest, info: getExpiryInfo(earliest.expiry_date) } : null
      })
      .filter((x): x is { product: ProductWithStock; stock: StockItem; info: ReturnType<typeof getExpiryInfo> } =>
        !!x && ['expired', 'critical', 'remove'].includes(x.info.status),
      )
      .sort((a, b) => a.info.daysLeft - b.info.daysLeft)
  }, [products])

  const handleStorageChange = (mode: 'supabase' | 'local') => {
    setStorageMode(mode)
    setStorageModeState(mode)
    resetRepositoryCache()
    window.location.reload()
  }

  const handleFormSubmit = async (data: Parameters<typeof addProduct>[0]) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-foreground truncate">{organization?.name || 'SKT Takip'}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.full_name || 'Kullanici'}{profile?.role ? ` - ${profile.role}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/app/import">
              <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Import</Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => signOut()}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <StatsCards products={products} />

        {/* Hizli Islemler entry */}
        <Link href="/app/hizli" className="block">
          <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    Hizli Islemler
                    {missingBarcodeCount > 0 && (
                      <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">{missingBarcodeCount} barkodsuz</Badge>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><ScanLine className="w-3 h-3" />Barkod ara</span>
                    <span className="flex items-center gap-1"><Barcode className="w-3 h-3" />Barkod ekle</span>
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Acil Urunler</h2>
              <Link href="/app/liste"><Button variant="ghost" size="sm">Tumunu Gor</Button></Link>
            </div>
            {urgentProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Acil urun yok.</p>
            ) : (
              <div className="space-y-2">
                {urgentProducts.slice(0, 5).map(({ product, stock, info }) => {
                  const config = statusConfig[info.status]
                  return (
                    <Link key={stock.id} href={`/app/urun?id=${product.id}`}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${config.border} ${config.bg}`}>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(stock.expiry_date)}</p>
                      </div>
                      <Badge className={`${config.badge} text-xs shrink-0`}>{info.label}</Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground mb-2">Veri Modu</h2>
            <div className="flex gap-2">
              <Button size="sm" variant={storageMode === 'local' ? 'default' : 'outline'} onClick={() => handleStorageChange('local')}>Local</Button>
              <Button size="sm" variant={storageMode === 'supabase' ? 'default' : 'outline'} onClick={() => handleStorageChange('supabase')}>Sunucu</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-4">
            <div className="w-full max-w-lg">
              <ProductForm
                onSubmit={handleFormSubmit}
                onCancel={() => { setFormOpen(false); setEditingProduct(null) }}
                initialData={editingProduct || undefined}
                locations={locations}
                brands={brands}
              />
            </div>
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name || ''}
      />

      <BottomNav onAddClick={() => { setEditingProduct(null); setFormOpen(true) }} />
    </main>
  )
}

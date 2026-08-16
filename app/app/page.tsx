'use client'

import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, formatDate } from '@/lib/expiry'
import { StatsCards } from '@/components/stats-cards'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, RefreshCw, ScanBarcode, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import type { ProductWithStock } from '@/lib/types'

export default function AppHomePage() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useAppData()

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)

  const getEarliestStock = (p: ProductWithStock) => {
    if (!p.stock_items || p.stock_items.length === 0) return null
    return [...p.stock_items].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
  }

  const urgentProducts = useMemo(() => {
    return products
      .map((p) => ({ product: p, stock: getEarliestStock(p) }))
      .filter((x): x is { product: ProductWithStock; stock: NonNullable<ReturnType<typeof getEarliestStock>> } => !!x.stock)
      .map((x) => ({ ...x, expiry: getExpiryInfo(x.stock.expiry_date) }))
      .filter((x) => ['expired', 'critical', 'remove'].includes(x.expiry.status))
      .sort((a, b) => a.expiry.daysLeft - b.expiry.daysLeft)
  }, [products])

  const missingBarcodeCount = useMemo(
    () => products.filter((p) => !p.barcode || !p.barcode.trim()).length,
    [products]
  )

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">SKT Takip</h1>
            <p className="text-xs text-gray-500">{products.length} urun kayitli</p>
          </div>
          <Link href="/app/import">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <StatsCards products={products} />

        {missingBarcodeCount > 0 && (
          <Link href="/app/barkodsuz">
            <Card className="p-4 border-amber-500/30 bg-amber-500/5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <ScanBarcode className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{missingBarcodeCount} urunun barkodu eksik</p>
                    <p className="text-xs text-muted-foreground">Hizlica barkod ekleyerek tamamlayin</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          </Link>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Acil Urunler</h2>
            <Link href="/app/liste">
              <Button variant="ghost" size="sm">
                Tumunu Gor
              </Button>
            </Link>
          </div>
          {urgentProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Acil urun yok.</p>
          ) : (
            <div className="space-y-2">
              {urgentProducts.slice(0, 5).map(({ product, stock, expiry }) => (
                <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                  <div className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(stock.expiry_date)} - {expiry.label}
                      </p>
                    </div>
                    <Badge variant={expiry.status === 'expired' ? 'destructive' : 'secondary'}>
                      {expiry.daysLeft} gun
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto">
            <ProductForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setFormOpen(false)
                setEditingProduct(null)
              }}
              initialData={editingProduct || undefined}
            />
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
    </div>
  )
}

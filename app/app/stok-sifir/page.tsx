'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCard } from '@/components/product-card'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ArrowLeft, PackageX, Search, Plus, Check } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

export default function ZeroStockPage() {
  const { products, brands, addStockItem, updateProduct, deleteProduct } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithStock | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [stockInput, setStockInput] = useState({ expiry_date: '', quantity: '1' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const zeroProducts = useMemo(() => {
    return products
      .filter((p) => (p.total_quantity ?? 0) === 0)
      .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  const handleAddStock = async (productId: string) => {
    if (!stockInput.expiry_date) return
    setSaving(true)
    try {
      await addStockItem({ product_id: productId, expiry_date: stockInput.expiry_date, quantity: parseInt(stockInput.quantity) || 1 })
      setExpandedId(null)
      setStockInput({ expiry_date: '', quantity: '1' })
    } finally {
      setSaving(false)
    }
  }

  const handleFormSubmit = async (data: any) => {
    if (editingProduct) await updateProduct(editingProduct.id, data)
    setFormOpen(false)
    setEditingProduct(null)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
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
            <Link href="/app/liste"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <PackageX className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Stok Sifir Urunler</h1>
              <p className="text-xs text-muted-foreground">SKT girerek geri getirin ya da kalici olarak silin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{zeroProducts.length}</Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Urun ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-muted/50"
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {zeroProducts.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-emerald-500/70 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Stok Sifir Urun Yok</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Aramanla eslesen stok sifir urun yok.' : 'Tum urunlerin stogu mevcut.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {zeroProducts.map((product) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={(p) => { setEditingProduct(p); setFormOpen(true) }}
                  onDelete={() => setDeleteTarget(product)}
                  compact
                />
                <div className="flex gap-2 mt-1.5 pl-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setExpandedId(expandedId === product.id ? null : product.id)
                      setStockInput({ expiry_date: '', quantity: '1' })
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> SKT Gir / Guncelle
                  </Button>
                  <Link href={`/app/urun?id=${product.id}`}><Button size="sm" variant="ghost">Detay</Button></Link>
                </div>
                {expandedId === product.id && (
                  <Card className="border-primary/30 mt-2">
                    <CardContent className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Son Kullanma Tarihi *</Label>
                          <Input
                            type="date"
                            value={stockInput.expiry_date}
                            onChange={(e) => setStockInput((s) => ({ ...s, expiry_date: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Adet</Label>
                          <Input
                            type="number"
                            min="1"
                            value={stockInput.quantity}
                            onChange={(e) => setStockInput((s) => ({ ...s, quantity: e.target.value }))}
                            className="h-10"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-10"
                        disabled={!stockInput.expiry_date || saving}
                        onClick={() => handleAddStock(product.id)}
                      >
                        Stogu Guncelle
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name || ''}
        title="Urunu Kalici Olarak Sil"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> urunu ve tum stok kayitlari kalici olarak silinecek. Bu islem geri alinamaz.
          </>
        }
        confirmLabel="Kalici Sil"
      />

      <BottomNav />
    </main>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppData } from '@/hooks/use-app-data'
import { getRepository } from '@/lib/repositories/repository.factory'
import { getExpiryInfo, getThresholds, formatDate, statusConfig } from '@/lib/expiry'
import { DeleteDialog } from '@/components/delete-dialog'
import { ProductForm } from '@/components/product-form'
import { ArrowLeft, Trash2, Plus, Tag, Package, Clock, Pencil, Thermometer } from 'lucide-react'
import type { ProductWithStock, StockItem } from '@/lib/types'

function ProductDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { brands, shelfLifeTypes, deleteProduct } = useAppData()
  const [product, setProduct] = useState<ProductWithStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showAddStock, setShowAddStock] = useState(false)
  const [deleteStockTarget, setDeleteStockTarget] = useState<StockItem | null>(null)
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(false)
  const [newStock, setNewStock] = useState({ expiry_date: '', quantity: '1' })

  const loadData = async () => {
    if (!id) { setIsLoading(false); return }
    const repo = getRepository()
    const prod = await repo.getProduct(id)
    setProduct(prod)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !newStock.expiry_date) return
    const repo = getRepository()
    await repo.createStockItem({
      product_id: product.id,
      expiry_date: newStock.expiry_date,
      quantity: parseInt(newStock.quantity) || 1,
    })
    setNewStock({ expiry_date: '', quantity: '1' })
    setShowAddStock(false)
    loadData()
  }

  const handleDeleteStock = async () => {
    if (!deleteStockTarget) return
    const repo = getRepository()
    await repo.deleteStockItem(deleteStockTarget.id)
    setDeleteStockTarget(null)
    loadData()
  }

  const handleZeroStock = async (stock: StockItem) => {
    const repo = getRepository()
    await repo.updateStockItem(stock.id, { quantity: 0 })
    loadData()
  }

  const handleUpdateMeta = async (data: any) => {
    if (!product) return
    const repo = getRepository()
    await repo.updateProduct(product.id, {
      name: data.name,
      stock_code: data.stock_code,
      barcode: data.barcode,
      brand_id: data.brand_id,
      shelf_life_type_id: data.shelf_life_type_id,
    })
    setEditing(false)
    loadData()
  }

  const handleDeleteProduct = async () => {
    if (!product) return
    await deleteProduct(product.id)
    setDeleteProductConfirm(false)
    router.push('/app/liste')
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Urun bulunamadi</p>
      </div>
    )
  }

  const stockItems = product.stock_items || []
  const distinctExpiryDates = new Set(stockItems.map((s) => s.expiry_date))

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{product.name}</h1>
              <p className="text-xs text-muted-foreground">Urun Detayi</p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setDeleteProductConfirm(true)}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {editing ? (
          <ProductForm
            initialData={product}
            brands={brands}
            shelfLifeTypes={shelfLifeTypes}
            onSubmit={handleUpdateMeta}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground">{product.name}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {product.stock_code && <span className="text-xs text-muted-foreground">Stok: {product.stock_code}</span>}
                    {product.barcode ? <span className="text-xs text-muted-foreground">Barkod: {product.barcode}</span> : <Badge variant="outline" className="text-xs">Barkod yok</Badge>}
                  </div>
                  {product.brand && (
                    <div className="flex items-center gap-1 mt-2"><Tag className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}</span></div>
                  )}
                  {product.shelf_life_type && (
                    <div className="flex items-center gap-1 mt-1"><Thermometer className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{product.shelf_life_type.name}</span></div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{stockItems.length} stok kaydi</Badge>
                    <Badge variant="outline" className="text-xs">{distinctExpiryDates.size} farkli SKT</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5 mr-1" />Duzenle</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2"><Clock className="w-4 h-4" />Stok Kayitlari</h3>
            <Button size="sm" variant="outline" onClick={() => setShowAddStock(!showAddStock)}><Plus className="w-4 h-4 mr-1" />SKT Ekle</Button>
          </div>

          {showAddStock && (
            <Card className="border-primary/30 mb-2">
              <CardContent className="p-3">
                <form onSubmit={handleAddStock} className="space-y-3">
                  <div className="space-y-1.5"><Label className="text-xs">Son Kullanma Tarihi *</Label><Input type="date" value={newStock.expiry_date} onChange={(e) => setNewStock({ ...newStock, expiry_date: e.target.value })} className="h-10" required /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Adet</Label><Input type="number" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })} className="h-10" min="1" /></div>
                  <div className="flex gap-2"><Button type="submit" className="flex-1 h-10">Ekle</Button><Button type="button" variant="outline" onClick={() => setShowAddStock(false)}>Iptal</Button></div>
                </form>
              </CardContent>
            </Card>
          )}

          {stockItems.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center"><Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Henuz stok kaydi yok</p><p className="text-xs text-muted-foreground mt-1">SKT ekleyerek baslayin</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {stockItems
                .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                .map((stock) => {
                  const info = getExpiryInfo(stock.expiry_date, getThresholds(product.shelf_life_type))
                  const config = statusConfig[info.status]
                  return (
                    <Card key={stock.id} className={`${config.bg} border ${config.border}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${config.badge} text-xs`}><Clock className="w-3 h-3 mr-1" />{info.label}</Badge>
                              <span className="text-xs text-muted-foreground">SKT: {formatDate(stock.expiry_date)}</span>
                              <Badge variant="outline" className="text-xs">Adet: {stock.quantity}</Badge>
                            </div>
                            {info.status !== 'safe' && <p className={`text-xs font-medium mt-1.5 ${config.text}`}>{info.actionRequired}</p>}
                          </div>
                          <div className="flex gap-1">
                            {stock.quantity > 0 && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleZeroStock(stock)} title="Stogu sifirla">Sifirla</Button>}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteStockTarget(stock)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      <DeleteDialog open={!!deleteStockTarget} onOpenChange={(open) => !open && setDeleteStockTarget(null)} onConfirm={handleDeleteStock} productName={`SKT: ${deleteStockTarget ? formatDate(deleteStockTarget.expiry_date) : ''}`} />

      <DeleteDialog
        open={deleteProductConfirm}
        onOpenChange={setDeleteProductConfirm}
        onConfirm={handleDeleteProduct}
        productName={product.name}
        title="Urunu Kalici Olarak Sil"
        description={
          <>
            <span className="font-medium text-foreground">{product.name}</span> urunu ve tum stok kayitlari kalici olarak silinecek. Bu islem geri alinamaz.
          </>
        }
        confirmLabel="Kalici Sil"
      />
    </main>
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ProductDetailContent />
    </Suspense>
  )
}

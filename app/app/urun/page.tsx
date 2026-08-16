'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getRepository } from '@/lib/repositories/repository.factory'
import { getExpiryInfo, formatDate, statusConfig } from '@/lib/expiry'
import { DeleteDialog } from '@/components/delete-dialog'
import { ArrowLeft, Trash2, Plus, Tag, Package, Clock, Barcode, Camera } from 'lucide-react'
import { BarcodeScanner } from '@/components/barcode-scanner'
import type { ProductWithStock, StockItem } from '@/lib/types'

function ProductDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [product, setProduct] = useState<ProductWithStock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddStock, setShowAddStock] = useState(false)
  const [deleteStockTarget, setDeleteStockTarget] = useState<StockItem | null>(null)
  const [newStock, setNewStock] = useState({ expiry_date: '', quantity: '1' })
  const [showScanner, setShowScanner] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')

  const loadData = async () => {
    if (!id) { setIsLoading(false); return }
    const repo = getRepository()
    const prod = await repo.getProduct(id)
    setProduct(prod)
    setBarcodeInput(prod?.barcode || '')
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

  const handleSaveBarcode = async () => {
    if (!product) return
    const repo = getRepository()
    await repo.updateProduct(product.id, { barcode: barcodeInput.trim() || undefined })
    loadData()
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

  if (showScanner) {
    return <BarcodeScanner onScan={(b) => { setBarcodeInput(b); setShowScanner(false) }} onClose={() => setShowScanner(false)} />
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
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Package className="w-6 h-6 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground">{product.name}</h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {product.stock_code && <span className="text-xs text-muted-foreground">Stok: {product.stock_code}</span>}
                  {product.barcode && <span className="text-xs text-muted-foreground">Barkod: {product.barcode}</span>}
                </div>
                {product.brand && (
                  <div className="flex items-center gap-1 mt-2"><Tag className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}</span></div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{stockItems.length} stok kaydi</Badge>
                  <Badge variant="outline" className="text-xs">{distinctExpiryDates.size} farkli SKT</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><Barcode className="w-4 h-4" />Barkod</h3>
            <div className="flex gap-2">
              <Input value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="Barkod yok" className="h-10 flex-1" />
              <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => setShowScanner(true)}><Camera className="w-4 h-4" /></Button>
              <Button type="button" className="h-10" disabled={barcodeInput === (product.barcode || '')} onClick={handleSaveBarcode}>Kaydet</Button>
            </div>
          </CardContent>
        </Card>

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
                  const info = getExpiryInfo(stock.expiry_date)
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

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getRepository } from '@/lib/repositories/repository.factory'
import { useAppData } from '@/hooks/use-app-data'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Trash2, Search, X, Camera, MapPin, MapPinOff, Loader2 } from 'lucide-react'
import type { PalletWithItems, PalletItem, Product, ProductWithStock } from '@/lib/types'
import { AdSlot } from '@/components/ad-slot'
import { DeleteDialog } from '@/components/delete-dialog'

function PalletDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { products, addPalletItem, removePalletItem, updateProduct } = useAppData()
  const [pallet, setPallet] = useState<PalletWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<(PalletItem & { product?: Product }) | null>(null)
  const [removing, setRemoving] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null)
  const [addQuantity, setAddQuantity] = useState('1')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    if (!id) { setIsLoading(false); return }
    const repo = getRepository()
    const p = await repo.getPallet(id)
    setPallet(p)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleScan = async (barcode: string) => {
    setShowScanner(false)
    if (!id) return
    const match = products.find((p) => p.barcode && p.barcode === barcode)
    if (!match) {
      setNotFoundBarcode(barcode)
      return
    }
    setNotFoundBarcode(null)
    await addPalletItem({ pallet_id: id, product_id: match.id, quantity: 1 })
    await load()
  }

  const handleRemoveItem = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removePalletItem(removeTarget.id)
      await load()
      setRemoveTarget(null)
    } finally {
      setRemoving(false)
    }
  }

  const resetAddForm = () => {
    setSelectedProduct(null)
    setSearchQuery('')
    setAddQuantity('1')
    setNotFoundBarcode(null)
  }

  const handleAddSelected = async () => {
    if (!id || !selectedProduct) return
    setAdding(true)
    try {
      await addPalletItem({ pallet_id: id, product_id: selectedProduct.id, quantity: parseInt(addQuantity) || 1 })
      await load()
      resetAddForm()
    } finally {
      setAdding(false)
    }
  }

  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)

  const handleToggleOnShelf = async (product: Product) => {
    setTogglingProductId(product.id)
    try {
      await updateProduct(product.id, { on_shelf: product.on_shelf === false })
      await load()
    } finally {
      setTogglingProductId(null)
    }
  }

  const searchResults = searchQuery.trim() && !selectedProduct
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchQuery)) ||
          (p.stock_code && p.stock_code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 8)
    : []

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!pallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Palet bulunamadi</p>
      </div>
    )
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
  }

  return (
    <main className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/app/paletler')}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{pallet.name}</h1>
              <p className="text-xs text-muted-foreground">Palet Detayi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card className="border-primary/30">
          <CardContent className="p-3 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Urun adi, stok kodu veya barkod ara..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedProduct(null); setNotFoundBarcode(null) }}
                  className="pl-9 h-10"
                />
              </div>
              <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => setShowScanner(true)}>
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 text-left"
                    onClick={() => { setSelectedProduct(p); setSearchQuery(p.name) }}
                  >
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{p.name}</p>
                      {p.brand && <p className="text-xs text-muted-foreground">{p.brand.name}</p>}
                    </div>
                    {p.on_shelf === false && <Badge variant="outline" className="text-xs shrink-0">Rafta Yok</Badge>}
                  </button>
                ))}
              </div>
            )}

            {notFoundBarcode && (
              <p className="text-xs text-amber-600">
                {notFoundBarcode} barkodlu urun sistemde yok.{' '}
                <Link href={`/app/ekle?barcode=${encodeURIComponent(notFoundBarcode)}`} className="underline">Once urunu ekleyin</Link>
              </p>
            )}

            {selectedProduct && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                    {selectedProduct.brand && <p className="text-xs text-muted-foreground">{selectedProduct.brand.name}</p>}
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={resetAddForm}><X className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-1"><label className="text-xs text-muted-foreground">Adet</label><Input type="number" min="1" value={addQuantity} onChange={(e) => setAddQuantity(e.target.value)} className="h-10" /></div>
                <Button className="w-full h-10" disabled={adding} onClick={handleAddSelected}>
                  {adding ? 'Ekleniyor...' : 'Palete Ekle'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold text-sm mb-2">Paletteki Urunler ({pallet.items?.length || 0})</h3>
          {(!pallet.items || pallet.items.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Bu palette henuz urun yok</p>
                <p className="text-xs text-muted-foreground mt-1">Yukaridan urun arayarak veya barkod okutarak baslayin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pallet.items.map((item) => {
                const onShelf = item.product ? item.product.on_shelf !== false : true
                return (
                  <Card key={item.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      {item.product ? (
                        <Link href={`/app/urun?id=${item.product_id}`} className="min-w-0 flex-1 block">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">Adet: {item.quantity}</Badge>
                            {!onShelf && <Badge variant="destructive" className="text-xs">Rafta Yok</Badge>}
                          </div>
                        </Link>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">Bilinmeyen urun</p>
                          <Badge variant="outline" className="text-xs mt-1">Adet: {item.quantity}</Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        {item.product && (
                          <Button
                            variant="outline"
                            size="icon"
                            className={`h-8 w-8 transition-colors ${onShelf ? 'text-emerald-600 border-emerald-500/30' : 'text-amber-600 border-amber-500/30'}`}
                            title={onShelf ? 'Rafta Var (degistirmek icin tikla)' : 'Rafta Yok (degistirmek icin tikla)'}
                            disabled={togglingProductId === item.product.id}
                            onClick={() => handleToggleOnShelf(item.product!)}
                          >
                            {togglingProductId === item.product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : onShelf ? (
                              <MapPin className="w-4 h-4" />
                            ) : (
                              <MapPinOff className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setRemoveTarget(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <AdSlot id="palet-detail" />
      </div>

      <BottomNav />

      <DeleteDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        onConfirm={handleRemoveItem}
        productName={removeTarget?.product?.name || 'Bilinmeyen urun'}
        title="Urunu Paletten Cikar"
        confirmLabel="Cikar"
        confirming={removing}
      />
    </main>
  )
}

export default function PalletDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <PalletDetailContent />
    </Suspense>
  )
}

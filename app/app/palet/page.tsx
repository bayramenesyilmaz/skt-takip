'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getRepository } from '@/lib/repositories/repository.factory'
import { useAppData } from '@/hooks/use-app-data'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, ScanLine, Trash2, AlertCircle } from 'lucide-react'
import type { PalletWithItems } from '@/lib/types'

function PalletDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { products, addPalletItem, removePalletItem } = useAppData()
  const [pallet, setPallet] = useState<PalletWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)

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

  const handleRemoveItem = async (itemId: string) => {
    await removePalletItem(itemId)
    await load()
  }

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
    <main className="min-h-screen bg-background pb-24">
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
        <Button className="w-full h-11" onClick={() => setShowScanner(true)}>
          <ScanLine className="w-4 h-4 mr-2" />Barkod Okutup Urun Ekle
        </Button>

        {notFoundBarcode && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p><span className="font-medium">{notFoundBarcode}</span> barkodlu urun sistemde yok.</p>
                <Link href={`/app/ekle?barcode=${encodeURIComponent(notFoundBarcode)}`} className="text-primary underline text-xs">Once urunu ekleyin</Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="font-semibold text-sm mb-2">Paletteki Urunler ({pallet.items?.length || 0})</h3>
          {(!pallet.items || pallet.items.length === 0) ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Bu palette henuz urun yok</p>
                <p className="text-xs text-muted-foreground mt-1">Barkod okutarak baslayin</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pallet.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.product?.name || 'Bilinmeyen urun'}</p>
                      <Badge variant="outline" className="text-xs mt-1">Adet: {item.quantity}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
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

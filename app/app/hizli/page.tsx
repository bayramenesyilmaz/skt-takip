'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { useAppData } from '@/hooks/use-app-data'
import { cn } from '@/lib/utils'
import { Zap, ScanLine, Barcode, Package, Search, Check, AlertCircle, ArrowRight, Tag } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

type Mode = 'lookup' | 'missing'
type ScanTarget = { type: 'lookup' } | { type: 'assign'; productId: string } | null

export default function HizliPage() {
  const router = useRouter()
  const { products, updateProduct, isLoading } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>('lookup')
  const [scanTarget, setScanTarget] = useState<ScanTarget>(null)
  const [lookupResult, setLookupResult] = useState<{ barcode: string; product: ProductWithStock | null } | null>(null)
  const [assignedInfo, setAssignedInfo] = useState<{ name: string; barcode: string } | null>(null)
  const [missingFilter, setMissingFilter] = useState('')

  useEffect(() => { setMounted(true) }, [])

  const missingProducts = useMemo(() => {
    const q = missingFilter.trim().toLowerCase()
    return products
      .filter((p) => !p.barcode || p.barcode.trim() === '')
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.stock_code && p.stock_code.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, missingFilter])

  const findByBarcode = (barcode: string) =>
    products.find((p) => p.barcode && p.barcode.trim() === barcode.trim()) || null

  const handleScan = async (barcode: string) => {
    const target = scanTarget
    setScanTarget(null)
    if (!target) return

    if (target.type === 'lookup') {
      const product = findByBarcode(barcode)
      if (product) {
        router.push(`/app/urun?id=${product.id}`)
        return
      }
      setLookupResult({ barcode, product: null })
    } else {
      const product = products.find((p) => p.id === target.productId)
      await updateProduct(target.productId, { barcode })
      setAssignedInfo({ name: product?.name || 'Ürün', barcode })
      setTimeout(() => setAssignedInfo(null), 3500)
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (scanTarget) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setScanTarget(null)} />
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Hizli Islemler</h1>
              <p className="text-xs text-muted-foreground">Barkod okut, ara ve ekle</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/50">
            <button
              onClick={() => setMode('lookup')}
              className={cn('flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors',
                mode === 'lookup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              <ScanLine className="w-4 h-4" />Barkod Ara
            </button>
            <button
              onClick={() => setMode('missing')}
              className={cn('flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors',
                mode === 'missing' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              <Barcode className="w-4 h-4" />Barkodsuz
              {missingProducts.length > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">{missingProducts.length}</Badge>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {assignedInfo && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{assignedInfo.name}</p>
              <p className="text-xs text-muted-foreground">Barkod eklendi: {assignedInfo.barcode}</p>
            </div>
          </div>
        )}

        {mode === 'lookup' ? (
          <div className="space-y-4">
            <Card className="border-primary/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Barkod ile Urun Bul</h2>
                  <p className="text-sm text-muted-foreground mt-1">Barkodu okut, urun detayina an&iacute;nda git</p>
                </div>
                <Button className="w-full h-12 text-base" onClick={() => { setLookupResult(null); setScanTarget({ type: 'lookup' }) }}>
                  <ScanLine className="w-5 h-5 mr-2" />Barkod Tara
                </Button>
              </CardContent>
            </Card>

            {lookupResult && !lookupResult.product && (
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">Urun Bulunamadi</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{lookupResult.barcode}</span> barkoduna sahip urun yok.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-9" onClick={() => router.push(`/app/ara?q=${lookupResult.barcode}`)}>
                          <Search className="w-4 h-4 mr-1.5" />Arama Yap
                        </Button>
                        <Button size="sm" className="h-9" onClick={() => router.push('/app/ekle')}>
                          <Package className="w-4 h-4 mr-1.5" />Urun Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Barkodsuz urunlerde ara..."
                value={missingFilter}
                onChange={(e) => setMissingFilter(e.target.value)}
                className="pl-9 h-11 bg-muted/50"
              />
            </div>

            {missingProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {missingFilter ? 'Sonuc yok' : 'Tum urunlerde barkod var'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {missingFilter ? 'Aramanizla eslesen barkodsuz urun yok' : 'Barkod eklenecek urun kalmadi'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{missingProducts.length} urunde barkod eksik</p>
                {missingProducts.map((product) => (
                  <Card key={product.id} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {product.stock_code && <span className="text-xs text-muted-foreground">Stok: {product.stock_code}</span>}
                            {product.brand && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />{product.brand.name}</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" className="h-9 shrink-0" onClick={() => setScanTarget({ type: 'assign', productId: product.id })}>
                          <ScanLine className="w-4 h-4 mr-1.5" />Tara
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

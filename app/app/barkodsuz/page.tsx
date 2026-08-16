'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ScanBarcode, Camera, Check, Package, Search } from 'lucide-react'

export default function MissingBarcodePage() {
  const { products, updateProduct } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const missingProducts = useMemo(() => {
    return products
      .filter((p) => !p.barcode || !p.barcode.trim())
      .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  const handleSave = async (productId: string) => {
    const value = (inputs[productId] || '').trim()
    if (!value) return
    setSavingId(productId)
    try {
      await updateProduct(productId, { barcode: value })
      setInputs((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    } finally {
      setSavingId(null)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (scanningId) {
    return (
      <BarcodeScanner
        onScan={(barcode) => {
          setInputs((prev) => ({ ...prev, [scanningId]: barcode }))
          setScanningId(null)
        }}
        onClose={() => setScanningId(null)}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/app"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ScanBarcode className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Barkodsuz Urunler</h1>
              <p className="text-xs text-muted-foreground">Barkodu olmayan urunlere hizlica barkod ekleyin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{missingProducts.length}</Badge>
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
        {missingProducts.length === 0 ? (
          <div className="text-center py-12">
            <Check className="w-12 h-12 text-emerald-500/70 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Hepsi Tamam</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Aramanla eslesen barkodsuz urun yok.' : 'Barkodu eksik urun kalmadi.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {missingProducts.map((product) => (
              <Card key={product.id} className="border-amber-500/20">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {product.stock_code && <p className="text-xs text-muted-foreground">Stok: {product.stock_code}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={inputs[product.id] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      placeholder="Barkod girin veya tarayin"
                      className="h-10 flex-1"
                    />
                    <Button type="button" variant="secondary" className="h-10 px-3" onClick={() => setScanningId(product.id)}>
                      <Camera className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      className="h-10"
                      disabled={!(inputs[product.id] || '').trim() || savingId === product.id}
                      onClick={() => handleSave(product.id)}
                    >
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

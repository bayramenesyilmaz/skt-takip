'use client'

import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Tag, ScanBarcode, PackageX, Layers, Info, Trash2, WifiOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { products, brands, reload } = useAppData()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const missingBarcodeCount = useMemo(
    () => products.filter((p) => !p.barcode || !p.barcode.trim()).length,
    [products]
  )

  const zeroStockCount = useMemo(
    () => products.filter((p) => (p.total_quantity ?? 0) === 0).length,
    [products]
  )

  const handleResetData = async () => {
    if (typeof window === 'undefined') return
    if (!window.confirm('Tum urunler, markalar ve stok kayitlari silinecek. Emin misiniz?')) return
    localStorage.removeItem('skt-local-products')
    localStorage.removeItem('skt-local-brands')
    localStorage.removeItem('skt-local-stock')
    await reload()
    router.push('/app')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Ayarlar</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-4 h-4" />
            <h2 className="font-semibold">Depolama</h2>
          </div>
          <p className="text-xs text-gray-500">Veriler yalnizca bu cihazda, tarayici hafizasinda saklanir. Internet veya hesap gerekmez.</p>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Veri Ozeti</h2>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-gray-500">Urun</p></div>
            <div><p className="text-2xl font-bold">{brands.length}</p><p className="text-xs text-gray-500">Marka</p></div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Yonetim</h2>
          <div className="space-y-2">
            <Link href="/app/markalar" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <Tag className="w-4 h-4" /> Markalar
            </Link>
            <Link href="/app/barkodsuz" className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
              <span className="flex items-center gap-2"><ScanBarcode className="w-4 h-4" /> Barkodsuz Urunler</span>
              {missingBarcodeCount > 0 && <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{missingBarcodeCount}</span>}
            </Link>
            <Link href="/app/stok-sifir" className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
              <span className="flex items-center gap-2"><PackageX className="w-4 h-4" /> Stok Sifir Urunler</span>
              {zeroStockCount > 0 && <span className="text-xs font-medium text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full">{zeroStockCount}</span>}
            </Link>
            <Link href="/app/paletler" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <Layers className="w-4 h-4" /> Paletler
            </Link>
          </div>
        </Card>

        <Card className="p-4 border-red-200">
          <h2 className="font-semibold mb-2 text-red-600">Veriler</h2>
          <p className="text-xs text-gray-500 mb-2">Tum urun, marka ve stok kayitlarini bu cihazdan siler.</p>
          <Button variant="outline" size="sm" onClick={handleResetData}>
            <Trash2 className="w-4 h-4 mr-1" /> Verileri Sifirla
          </Button>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Uygulama Bilgisi</h2>
          </div>
          <p className="text-xs text-gray-500">Versiyon 4.0.0 - Yerel PWA</p>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}

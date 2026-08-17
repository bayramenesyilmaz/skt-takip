'use client'

import { useAppData } from '@/hooks/use-app-data'
import { getRepository } from '@/lib/repositories/repository.factory'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Tag, ScanBarcode, PackageX, Layers, Layers3, Info, Trash2, WifiOff, Download, RefreshCcw, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { products, brands, reload } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const missingBarcodeCount = useMemo(
    () => products.filter((p) => !p.barcode || !p.barcode.trim()).length,
    [products]
  )

  const zeroStockCount = useMemo(
    () => products.filter((p) => (p.total_quantity ?? 0) === 0).length,
    [products]
  )

  const handleExport = async () => {
    setExporting(true)
    try {
      const repo = getRepository()
      const data = await repo.exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `skt-takip-yedek-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleResetData = async () => {
    if (typeof window === 'undefined') return
    if (!window.confirm('Tum urunler, markalar, stok ve palet kayitlari silinecek. Once yedek almanizi oneririz. Devam edilsin mi?')) return
    localStorage.removeItem('skt-local-products')
    localStorage.removeItem('skt-local-brands')
    localStorage.removeItem('skt-local-stock')
    localStorage.removeItem('skt-local-pallets')
    localStorage.removeItem('skt-local-pallet-items')
    await reload()
    router.push('/app')
  }

  const handleForceUpdate = async () => {
    setUpdating(true)
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } finally {
      window.location.reload()
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Ayarlar</h1>
              <p className="text-xs text-muted-foreground">Uygulama yonetimi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">Depolama</h2>
            </div>
            <p className="text-xs text-muted-foreground">Veriler yalnizca bu cihazda, tarayici hafizasinda saklanir. Internet veya hesap gerekmez.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground text-sm mb-3">Veri Ozeti</h2>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div><p className="text-2xl font-bold text-foreground">{products.length}</p><p className="text-xs text-muted-foreground">Urun</p></div>
              <div><p className="text-2xl font-bold text-foreground">{brands.length}</p><p className="text-xs text-muted-foreground">Marka</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-foreground text-sm mb-3">Yonetim</h2>
            <div className="space-y-2">
              <Link href="/app/markalar" className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Tag className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Markalar</span>
              </Link>
              <Link href="/app/paletler" className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Layers className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Paletler</span>
              </Link>
              <Link href="/app/ekle?tab=bulk" className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Layers3 className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Toplu Urun Ekle</span>
              </Link>
              <Link href="/app/barkodsuz" className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2"><ScanBarcode className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Barkodsuz Urunler</span></span>
                {missingBarcodeCount > 0 && <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">{missingBarcodeCount}</Badge>}
              </Link>
              <Link href="/app/stok-sifir" className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2"><PackageX className="w-4 h-4 text-muted-foreground" /> <span className="text-sm">Stok Sifir Urunler</span></span>
                {zeroStockCount > 0 && <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600">{zeroStockCount}</Badge>}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCcw className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">Uygulamayi Guncelle</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Yeni bir surum yayinlandiginda ekranda eski goruntu kaliyorsa kullanin. Urun verileriniz silinmez, sadece uygulama onbellegi temizlenir.</p>
            <Button variant="outline" size="sm" disabled={updating} onClick={handleForceUpdate}>
              <RefreshCcw className={`w-4 h-4 mr-1 ${updating ? 'animate-spin' : ''}`} /> {updating ? 'Guncelleniyor...' : 'Uygulamayi Guncelle'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-1 text-red-600 text-sm">Veriler</h2>
            <p className="text-xs text-muted-foreground mb-3">Silmeden once yedek almanizi oneririz. Yedek dosyasini daha sonra Import ekranindan geri yukleyebilirsiniz.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" /> {exporting ? 'Hazirlaniyor...' : 'Disa Aktar (Yedekle)'}
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-500/10" onClick={handleResetData}>
                <Trash2 className="w-4 h-4 mr-1" /> Verileri Sifirla
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground text-sm">Uygulama Bilgisi</h2>
            </div>
            <p className="text-xs text-muted-foreground">Versiyon 4.0.0 - Yerel PWA</p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </main>
  )
}

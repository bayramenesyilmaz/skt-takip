'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getRepository } from '@/lib/repositories/repository.factory'
import { useAppData } from '@/hooks/use-app-data'
import { ProductForm } from '@/components/product-form'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { ProductSearchCard } from '@/components/product-search-card'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Package, Layers, ScanLine, CheckCircle2 } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

type Mode = 'scan' | 'form' | 'exists'

function AddProductContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillBarcode = searchParams.get('barcode') || ''
  const { products, brands, addProduct, bulkAddProducts, isLoading } = useAppData()
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [mode, setMode] = useState<Mode>(prefillBarcode ? 'form' : 'scan')
  const [barcode, setBarcode] = useState(prefillBarcode)
  const [existingProduct, setExistingProduct] = useState<ProductWithStock | null>(null)
  const [palletInfo, setPalletInfo] = useState<{ name: string; quantity: number }[]>([])
  const [checkedPrefill, setCheckedPrefill] = useState(false)

  const lookup = (code: string) => {
    setBarcode(code)
    const match = products.find((p) => p.barcode && p.barcode === code)
    if (match) {
      setExistingProduct(match)
      setMode('exists')
    } else {
      setExistingProduct(null)
      setMode('form')
    }
  }

  useEffect(() => {
    if (prefillBarcode && !isLoading && !checkedPrefill) {
      setCheckedPrefill(true)
      lookup(prefillBarcode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillBarcode, isLoading])

  useEffect(() => {
    if (mode === 'exists' && existingProduct) {
      const repo = getRepository()
      repo.getPalletItemsForProduct(existingProduct.id).then((items) => {
        setPalletInfo(items.map((i) => ({ name: i.pallet.name, quantity: i.quantity })))
      })
    } else {
      setPalletInfo([])
    }
  }, [mode, existingProduct])

  if (mode === 'scan') {
    return (
      <BarcodeScanner
        onScan={lookup}
        onClose={() => router.push('/app')}
        secondaryAction={{ label: 'Barkod Olmadan Urun Ekle', onClick: () => { setExistingProduct(null); setBarcode(''); setMode('form') } }}
      />
    )
  }

  if (mode === 'exists' && existingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="font-semibold text-lg">Urun Bulundu</h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">Bu barkod sistemde kayitli</p>
            </div>
          </Card>

          <ProductSearchCard product={existingProduct} palletInfo={palletInfo} />

          <div className="flex gap-2">
            <Link href={`/app/urun?id=${existingProduct.id}`} className="flex-1">
              <Button className="w-full h-11">Urunu Guncelle (SKT Ekle)</Button>
            </Link>
            <Button variant="outline" className="h-11" onClick={() => { setMode('scan'); setExistingProduct(null) }}>
              <ScanLine className="w-4 h-4 mr-1" />Tekrar Tara
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Urun Ekle</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {barcode && (
          <Card className="p-3 border-amber-500/30 bg-amber-500/5">
            <p className="text-sm">
              Taranan barkod <span className="font-medium">{barcode}</span> sistemde bulunamadi. Asagidan urun bilgilerini girip ekleyebilirsiniz.
            </p>
          </Card>
        )}

        <div className="flex gap-2">
          <Button variant={tab === 'single' ? 'default' : 'outline'} onClick={() => setTab('single')}>
            <Package className="w-4 h-4 mr-1" /> Tekil
          </Button>
          <Button variant={tab === 'bulk' ? 'default' : 'outline'} onClick={() => setTab('bulk')}>
            <Layers className="w-4 h-4 mr-1" /> Toplu
          </Button>
          <Button variant="outline" onClick={() => { setBarcode(''); setMode('scan') }}>
            <ScanLine className="w-4 h-4 mr-1" /> Tara
          </Button>
        </div>

        {tab === 'single' ? (
          <ProductForm
            onSubmit={async (data) => { await addProduct(data); router.push('/app') }}
            onCancel={() => router.push('/app')}
            brands={brands}
            initialBarcode={barcode}
          />
        ) : (
          <BulkProductAdd
            onAdd={async (items) => { await bulkAddProducts(items); router.push('/app') }}
            onCancel={() => router.push('/app')}
          />
        )}
      </main>

      <BottomNav />
    </div>
  )
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <AddProductContent />
    </Suspense>
  )
}

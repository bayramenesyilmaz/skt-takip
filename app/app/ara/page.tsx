'use client'

import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, formatDate } from '@/lib/expiry'
import { BottomNav } from '@/components/bottom-nav'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ScanLine, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

export default function SearchPage() {
  const { products, locations } = useAppData()
  const [query, setQuery] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

  const locationMap = useMemo(() => {
    const m: Record<string, any> = {}
    locations.forEach((l: any) => { m[l.id] = l })
    return m
  }, [locations])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products
      .filter((p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.includes(q) ||
        p.stockCode?.toLowerCase().includes(q)
      )
      .map((p: any) => {
        const loc = p.locationId ? locationMap[p.locationId] : null
        return { ...p, expiry: getExpiryInfo(p.expiryDate), locationName: loc?.name }
      })
  }, [products, query, locationMap])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Ara</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Isim, barkod veya stok kodu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <ScanLine className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {query.trim() === '' ? (
            <Card className="p-4 text-center text-sm text-gray-500">
              Aramak icin yazin veya tarayin.
            </Card>
          ) : results.length === 0 ? (
            <Card className="p-4 text-center text-sm text-gray-500">
              Sonuc bulunamadi.
            </Card>
          ) : (
            results.map((p: any) => (
              <Link key={p.id} href={`/app/urun?id=${p.id}`}>
                <Card className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.locationName || 'Konum yok'} - {formatDate(p.expiryDate)}
                    </p>
                  </div>
                  <Badge variant={p.expiry.status === 'expired' ? 'destructive' : 'secondary'}>
                    {p.expiry.label}
                  </Badge>
                </Card>
              </Link>
            ))
          )}
        </div>
      </main>

      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setQuery(code); setScannerOpen(false) }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

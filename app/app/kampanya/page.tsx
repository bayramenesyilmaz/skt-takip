'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { getExpiryInfo, getThresholds, formatDate } from '@/lib/expiry'
import { buildShareMessage } from '@/lib/share'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ShoppingCart, Package, Share2, Copy, Check, X, Search, Tag } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

export default function KampanyaPage() {
  const { products, brands } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [shareMode, setShareMode] = useState(false)
  const [shareQuantities, setShareQuantities] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const allCampaignProducts = useMemo(() => {
    return products
      .filter((p) => (p.total_quantity ?? 0) > 0)
      .map((p) => {
        const active = (p.stock_items || []).filter((s) => s.quantity > 0)
        if (active.length === 0) return null
        const earliest = [...active].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
        const info = getExpiryInfo(earliest.expiry_date, getThresholds(p.shelf_life_type))
        return info.status === 'campaign' ? { product: p, date: earliest.expiry_date, daysLeft: info.daysLeft } : null
      })
      .filter((x): x is { product: ProductWithStock; date: string; daysLeft: number } => x !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [products])

  const campaignProducts = useMemo(() => {
    let result = allCampaignProducts
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(({ product: p }) =>
        p.name.toLowerCase().includes(q) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }
    if (brandFilter !== 'all') {
      result = result.filter(({ product: p }) => p.brand_id === brandFilter)
    }
    return result
  }, [allCampaignProducts, search, brandFilter])

  const allSelected = campaignProducts.length > 0 && campaignProducts.every((x) => selectedIds.has(x.product.id))

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(campaignProducts.map((x) => x.product.id)))
  }

  const selectedItems = useMemo(
    () => campaignProducts.filter((x) => selectedIds.has(x.product.id)),
    [campaignProducts, selectedIds]
  )

  const handleCopyShare = async () => {
    try {
      const message = buildShareMessage(selectedItems.map((x) => ({ product: x.product, date: x.date })), shareQuantities)
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable, ignore
    }
  }

  const handleWhatsAppShare = () => {
    const message = buildShareMessage(selectedItems.map((x) => ({ product: x.product, date: x.date })), shareQuantities)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (shareMode) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShareMode(false)}><X className="w-5 h-5" /></Button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-foreground">Paylas</h1>
                <p className="text-xs text-muted-foreground">{selectedItems.length} urun secili - istege bagli adet girin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={handleCopyShare}>
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Kopyalandi' : 'Kopyala'}
              </Button>
              <Button className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700" onClick={handleWhatsAppShare}>
                <Share2 className="w-4 h-4 mr-1" />WhatsApp'ta Paylas
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
          {selectedItems.map(({ product: p, date }) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  {(p.stock_code || p.barcode) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {p.stock_code && <>Stok Kodu: {p.stock_code}</>}
                      {p.stock_code && p.barcode && ' | '}
                      {p.barcode && <>Barkod: {p.barcode}</>}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">SKT: {formatDate(date)}</p>
                </div>
                <div className="w-28 shrink-0 space-y-1">
                  <Label className="text-xs">Adet (opsiyonel)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="-"
                    value={shareQuantities[p.id] || ''}
                    onChange={(e) => setShareQuantities((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/app"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Kampanya Urunleri</h1>
              <p className="text-xs text-muted-foreground">Secip yeticiye bildirin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{allCampaignProducts.length}</Badge>
          </div>

          {allCampaignProducts.length > 0 && (
            <div className="flex gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Urun ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted/50"
                />
              </div>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="h-10 bg-muted/50 w-36 shrink-0">
                  <Tag className="w-3.5 h-3.5 mr-1 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tum Markalar</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {allCampaignProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Kampanya Urunu Yok</h3>
            <p className="text-sm text-muted-foreground">Su anda kampanya durumunda urun bulunmuyor.</p>
          </div>
        ) : campaignProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Urun Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">Filtrelere uyan kampanya urunu yok.</p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 p-3 mb-2 rounded-lg border border-dashed border-border cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-primary shrink-0"
              />
              <span className="text-sm font-medium text-foreground">
                {allSelected ? 'Tumunun secimini kaldir' : `Tumunu Sec (${campaignProducts.length})`}
              </span>
            </label>

            <div className="space-y-2">
              {campaignProducts.map(({ product: p, date, daysLeft }) => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelected(p.id)}
                    className="w-4 h-4 accent-primary shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.brand?.name ? `${p.brand.name} - ` : ''}SKT: {formatDate(date)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{daysLeft} gun</Badge>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
          <div className="max-w-lg mx-auto px-4 py-3">
            <Button className="w-full h-10" onClick={() => setShareMode(true)}>
              <Share2 className="w-4 h-4 mr-1" />Secilenleri Paylas ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}

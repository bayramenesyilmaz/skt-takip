'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { formatDate } from '@/lib/expiry'
import { buildReturnShareMessage } from '@/lib/share'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Undo2, Camera, Search, Plus, X, Trash2, ListChecks, Tag, Package, Copy, Check, Share2 } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

export default function IadePage() {
  const { products, brands, returnRecords, addReturnRecord, deleteReturnRecord, bulkDeleteReturnRecords } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const [brandFilter, setBrandFilter] = useState('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || selectedProduct) return []
    const q = searchQuery.toLowerCase()
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)) || (p.stock_code && p.stock_code.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [searchQuery, products, selectedProduct])

  const handleScan = (code: string) => {
    setShowScanner(false)
    const match = products.find((p) => p.barcode && p.barcode === code)
    if (match) {
      setSelectedProduct(match)
      setSearchQuery(match.name)
      setNotFoundBarcode(null)
    } else {
      setNotFoundBarcode(code)
      setSelectedProduct(null)
    }
  }

  const resetAddForm = () => {
    setSelectedProduct(null)
    setSearchQuery('')
    setQuantity('1')
    setNote('')
    setNotFoundBarcode(null)
  }

  const handleAddReturn = async () => {
    if (!selectedProduct) return
    setSaving(true)
    try {
      await addReturnRecord({
        product_id: selectedProduct.id,
        quantity: parseInt(quantity) || 1,
        note: note.trim() || undefined,
      })
      resetAddForm()
    } finally {
      setSaving(false)
    }
  }

  const filteredRecords = useMemo(() => {
    if (brandFilter === 'all') return returnRecords
    return returnRecords.filter((r) => r.product?.brand_id === brandFilter)
  }, [returnRecords, brandFilter])

  const allSelected = filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(r.id))

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredRecords.map((r) => r.id)))
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const selectedRecords = useMemo(
    () => filteredRecords.filter((r) => selectedIds.has(r.id)),
    [filteredRecords, selectedIds]
  )

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(buildReturnShareMessage(selectedRecords))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable, ignore
    }
  }

  const handleWhatsAppShare = () => {
    const message = buildReturnShareMessage(selectedRecords)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleDeleteOne = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteReturnRecord(deleteTarget)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    setDeleting(true)
    try {
      await bulkDeleteReturnRecords(Array.from(selectedIds))
      setBulkDeleteConfirm(false)
      exitSelectMode()
    } finally {
      setDeleting(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
  }

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/app/ayarlar"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Undo2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Iade Kayitlari</h1>
              <p className="text-xs text-muted-foreground">Iadeye gonderilenleri takip edin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{returnRecords.length}</Badge>
            <Button
              variant={selectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            >
              {selectMode ? <X className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
            </Button>
          </div>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-9 bg-muted/50 w-full">
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
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card className="border-primary/30">
          <CardContent className="p-3 space-y-3">
            <Label className="text-sm font-medium">Iade Icin Urun Ekle</Label>
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Adet</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">Not (opsiyonel)</Label><Input placeholder="orn: son kullanma tarihi gecti" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></div>
                <Button className="w-full h-10" disabled={saving} onClick={handleAddReturn}>
                  <Plus className="w-4 h-4 mr-1" />{saving ? 'Ekleniyor...' : 'Iade Kaydi Ekle'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {selectMode && filteredRecords.length > 0 && (
          <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 accent-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">
              {allSelected ? 'Tumunun secimini kaldir' : `Tumunu Sec (${filteredRecords.length})`}
            </span>
          </label>
        )}

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Undo2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Iade Kaydi Yok</h3>
            <p className="text-sm text-muted-foreground">
              {brandFilter !== 'all' ? 'Bu markaya ait iade kaydi yok.' : 'Yukaridan urun arayarak veya barkod okutarak iade kaydi ekleyin.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map((r) => (
              selectMode ? (
                <label key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelected(r.id)} className="w-4 h-4 accent-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.product?.name || 'Silinmis urun'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.product?.brand?.name ? `${r.product.brand.name} - ` : ''}Adet: {r.quantity} - {formatDate(r.created_at)}
                    </p>
                    {r.note && <p className="text-xs text-muted-foreground italic truncate">{r.note}</p>}
                  </div>
                </label>
              ) : (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.product?.name || 'Silinmis urun'}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {r.product?.brand && <span className="text-xs text-muted-foreground">{r.product.brand.name}</span>}
                        <Badge variant="outline" className="text-xs">Adet: {r.quantity}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                      </div>
                      {r.note && <p className="text-xs text-muted-foreground italic mt-1">{r.note}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setDeleteTarget(r.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>

      {selectMode && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
          <div className="max-w-lg mx-auto px-4 py-2 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10"
                disabled={selectedIds.size === 0}
                onClick={handleCopyShare}
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Kopyalandi' : 'Kopyala'}
              </Button>
              <Button
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700"
                disabled={selectedIds.size === 0}
                onClick={handleWhatsAppShare}
              >
                <Share2 className="w-4 h-4 mr-1" />WhatsApp&apos;ta Paylas
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />Secilenleri Sil ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      <BottomNav />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteOne}
        productName=""
        title="Iade Kaydini Sil"
        description="Bu iade kaydi kalici olarak silinecek."
        confirmLabel="Sil"
        confirming={deleting}
      />

      <DeleteDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        onConfirm={handleBulkDelete}
        productName=""
        title="Secilen Kayitlari Sil"
        description={`${selectedIds.size} iade kaydi kalici olarak silinecek.`}
        confirmLabel="Sil"
        confirming={deleting}
      />
    </main>
  )
}

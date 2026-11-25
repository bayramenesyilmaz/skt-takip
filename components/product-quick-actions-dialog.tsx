"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Undo2, CalendarPlus, Plus, MapPin, MapPinOff, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/expiry'
import type { Product, ProductWithStock } from '@/lib/types'

interface ProductQuickActionsDialogProps {
  product: ProductWithStock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddReturn: (data: { product_id: string; quantity: number; note?: string }) => Promise<unknown>
  onDeductStock: (productId: string, amount: number, preferredExpiryDate?: string) => Promise<unknown>
  onAddStock: (data: { product_id: string; expiry_date: string; quantity: number }) => Promise<void>
  onToggleOnShelf: (productId: string, updates: Partial<Product>) => Promise<void>
}

export function ProductQuickActionsDialog({
  product,
  open,
  onOpenChange,
  onAddReturn,
  onDeductStock,
  onAddStock,
  onToggleOnShelf,
}: ProductQuickActionsDialogProps) {
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')
  const [savingReturn, setSavingReturn] = useState(false)
  const [returnSaved, setReturnSaved] = useState(false)

  const [showSktForm, setShowSktForm] = useState(false)
  const [newSkt, setNewSkt] = useState({ expiry_date: '', quantity: '1' })
  const [savingSkt, setSavingSkt] = useState(false)

  const [togglingShelf, setTogglingShelf] = useState(false)

  useEffect(() => {
    if (open) {
      setQuantity('1')
      setNote('')
      setReturnSaved(false)
      setShowSktForm(false)
      setNewSkt({ expiry_date: '', quantity: '1' })
    }
  }, [open, product?.id])

  if (!product) return null

  const totalQty = product.total_quantity ?? 0
  const activeStock = (product.stock_items || []).filter((s) => s.quantity > 0)
  const earliest = [...activeStock].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
  const onShelf = product.on_shelf !== false

  const handleToggleShelf = async () => {
    setTogglingShelf(true)
    try {
      await onToggleOnShelf(product.id, { on_shelf: !onShelf })
    } finally {
      setTogglingShelf(false)
    }
  }

  const handleAddReturn = async () => {
    const qty = parseInt(quantity) || 1
    setSavingReturn(true)
    try {
      await onAddReturn({ product_id: product.id, quantity: qty, note: note.trim() || undefined })
      await onDeductStock(product.id, qty)
      setReturnSaved(true)
      setTimeout(() => onOpenChange(false), 700)
    } finally {
      setSavingReturn(false)
    }
  }

  const handleAddSkt = async () => {
    if (!newSkt.expiry_date) return
    setSavingSkt(true)
    try {
      await onAddStock({ product_id: product.id, expiry_date: newSkt.expiry_date, quantity: parseInt(newSkt.quantity) || 1 })
      onOpenChange(false)
    } finally {
      setSavingSkt(false)
    }
  }

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Undo2 className="w-4 h-4 text-primary" />{product.name}</DialogTitle>
            <DialogDescription>
              Stok: {totalQty}{earliest && <> - SKT: {formatDate(earliest.expiry_date)}</>}{!onShelf && <> - Rafta Yok</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Iade Kaldir</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Adet</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Not (opsiyonel)</Label><Input placeholder="orn: son kullanma tarihi gecti" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></div>
            <p className="text-xs text-muted-foreground">Girilen adet iade olarak kaydedilir ve ayni anda stoktan da dusulur (en erken SKT&apos;den baslanarak).</p>
            <Button className="w-full h-10" disabled={savingReturn} onClick={handleAddReturn}>
              {returnSaved ? 'Kaldirildi' : savingReturn ? 'Isleniyor...' : 'Iade Kaldir'}
            </Button>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground">Veya hizlica:</p>
            <Button variant="outline" className="w-full h-10" onClick={() => setShowSktForm((v) => !v)}>
              <CalendarPlus className="w-4 h-4 mr-1" />Yeni SKT Gir
            </Button>
            <Button variant="outline" className={`w-full h-10 ${onShelf ? '' : 'border-amber-500/40 text-amber-700'}`} disabled={togglingShelf} onClick={handleToggleShelf}>
              {togglingShelf ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : onShelf ? (
                <MapPinOff className="w-4 h-4 mr-1" />
              ) : (
                <MapPin className="w-4 h-4 mr-1" />
              )}
              {togglingShelf ? 'Isleniyor...' : onShelf ? 'Rafta Yok Olarak Isaretle' : 'Rafa Konuldu Olarak Isaretle'}
            </Button>

            {showSktForm && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Son Kullanma Tarihi *</Label><Input type="date" value={newSkt.expiry_date} onChange={(e) => setNewSkt((s) => ({ ...s, expiry_date: e.target.value }))} className="h-10" /></div>
                  <div className="space-y-1"><Label className="text-xs">Adet</Label><Input type="number" min="1" value={newSkt.quantity} onChange={(e) => setNewSkt((s) => ({ ...s, quantity: e.target.value }))} className="h-10" /></div>
                </div>
                <Button className="w-full h-10" disabled={!newSkt.expiry_date || savingSkt} onClick={handleAddSkt}>
                  <Plus className="w-4 h-4 mr-1" />{savingSkt ? 'Ekleniyor...' : 'SKT Ekle'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}

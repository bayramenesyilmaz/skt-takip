"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DeleteDialog } from '@/components/delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Undo2, PackageX, CalendarPlus, Plus, MapPin, MapPinOff, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/expiry'
import type { Product, ProductWithStock } from '@/lib/types'

interface ProductQuickActionsDialogProps {
  product: ProductWithStock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddReturn: (data: { product_id: string; quantity: number; note?: string }) => Promise<unknown>
  onZeroStock: (productId: string) => Promise<void>
  onAddStock: (data: { product_id: string; expiry_date: string; quantity: number }) => Promise<void>
  onToggleOnShelf: (productId: string, updates: Partial<Product>) => Promise<void>
}

export function ProductQuickActionsDialog({
  product,
  open,
  onOpenChange,
  onAddReturn,
  onZeroStock,
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

  const [confirmZero, setConfirmZero] = useState(false)
  const [zeroing, setZeroing] = useState(false)
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
    setSavingReturn(true)
    try {
      await onAddReturn({ product_id: product.id, quantity: parseInt(quantity) || 1, note: note.trim() || undefined })
      setReturnSaved(true)
      setTimeout(() => onOpenChange(false), 700)
    } finally {
      setSavingReturn(false)
    }
  }

  const handleZeroStock = async () => {
    setZeroing(true)
    try {
      await onZeroStock(product.id)
      setConfirmZero(false)
      onOpenChange(false)
    } finally {
      setZeroing(false)
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Undo2 className="w-4 h-4 text-primary" />{product.name}</DialogTitle>
            <DialogDescription>
              Stok: {totalQty}{earliest && <> - SKT: {formatDate(earliest.expiry_date)}</>}{!onShelf && <> - Rafta Yok</>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Iade Kaydi Ekle</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Adet</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Not (opsiyonel)</Label><Input placeholder="orn: son kullanma tarihi gecti" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></div>
            <Button className="w-full h-10" disabled={savingReturn} onClick={handleAddReturn}>
              {returnSaved ? 'Eklendi' : savingReturn ? 'Ekleniyor...' : 'Iade Kaydi Ekle'}
            </Button>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground">Veya hizlica:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-10" onClick={() => setConfirmZero(true)} disabled={totalQty === 0}>
                <PackageX className="w-4 h-4 mr-1" />Stogu Sifirla
              </Button>
              <Button variant="outline" className="h-10" onClick={() => setShowSktForm((v) => !v)}>
                <CalendarPlus className="w-4 h-4 mr-1" />Yeni SKT Gir
              </Button>
            </div>
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

      <DeleteDialog
        open={confirmZero}
        onOpenChange={setConfirmZero}
        onConfirm={handleZeroStock}
        productName={product.name}
        title="Stogu Sifirla"
        description={
          <>
            <span className="font-medium text-foreground">{product.name}</span> urununun stogu sifirlanacak ve &quot;Stok Sifir&quot; listesine tasinacak. Oradan kalici olarak silebilir ya da yeni SKT girerek geri getirebilirsiniz.
          </>
        }
        confirmLabel="Stogu Sifirla"
        confirming={zeroing}
      />
    </>
  )
}

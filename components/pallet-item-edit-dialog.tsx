"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/expiry'
import type { PalletItem, Product, ProductWithStock } from '@/lib/types'

interface PalletItemEditDialogProps {
  item: (PalletItem & { product?: Product }) | null
  product?: ProductWithStock
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (itemId: string, newQuantity: number) => Promise<unknown>
  onDeductStock: (productId: string, amount: number, preferredExpiryDate?: string) => Promise<unknown>
}

export function PalletItemEditDialog({ item, product, open, onOpenChange, onSave, onDeductStock }: PalletItemEditDialogProps) {
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && item) setQuantity(String(item.quantity))
  }, [open, item?.id])

  if (!item) return null

  const activeStock = (product?.stock_items || []).filter((s) => s.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  const totalStock = activeStock.reduce((sum, s) => sum + s.quantity, 0)
  const newQty = parseInt(quantity) || 0
  const delta = item.quantity - newQty

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(item.id, newQty)
      if (delta > 0) {
        await onDeductStock(item.product_id, delta, item.expiry_date)
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.product?.name || 'Bilinmeyen urun'}</DialogTitle>
          <DialogDescription>
            {item.expiry_date ? <>Bu kalem SKT: {formatDate(item.expiry_date)}</> : 'Bu kalem belirli bir SKT\'ye bagli degil'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Palet Adedi</Label>
            <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-10" />
          </div>

          {delta > 0 && (
            <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              {delta} adet gercek stoktan da dusulecek{item.expiry_date ? ` (once SKT: ${formatDate(item.expiry_date)}, yetmezse en erken SKT'den)` : " (en erken SKT'den baslanarak)"}.
            </p>
          )}

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Urunun Gercek Stok Durumu</Label>
              <Badge variant="outline" className="text-xs">Toplam: {totalStock}</Badge>
            </div>
            {activeStock.length === 0 ? (
              <p className="text-xs text-muted-foreground">Bu urunun aktif stogu yok.</p>
            ) : (
              <div className="space-y-1.5">
                {activeStock.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-muted/50">
                    <span>SKT: {formatDate(s.expiry_date)}</span>
                    <Badge variant="outline" className="text-xs">Adet: {s.quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full h-10" disabled={saving} onClick={handleSave}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

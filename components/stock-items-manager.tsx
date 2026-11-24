"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/delete-dialog'
import { getExpiryInfo, getThresholds, formatDate, statusConfig } from '@/lib/expiry'
import { Plus, Clock, Pencil, Check, X, Trash2, Loader2 } from 'lucide-react'
import type { ShelfLifeType, StockItem } from '@/lib/types'

interface StockItemsManagerProps {
  productId: string
  stockItems: StockItem[]
  shelfLifeType?: ShelfLifeType
  onAdd: (data: { product_id: string; expiry_date: string; quantity: number }) => Promise<unknown>
  onUpdate: (stockId: string, data: Partial<StockItem>) => Promise<unknown>
  onDelete: (stockId: string) => Promise<unknown>
}

export function StockItemsManager({ productId, stockItems, shelfLifeType, onAdd, onUpdate, onDelete }: StockItemsManagerProps) {
  const [showAddStock, setShowAddStock] = useState(false)
  const [newStock, setNewStock] = useState({ expiry_date: '', quantity: '1' })
  const [adding, setAdding] = useState(false)

  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editStock, setEditStock] = useState({ expiry_date: '', quantity: '1' })
  const [savingEdit, setSavingEdit] = useState(false)

  const [zeroingId, setZeroingId] = useState<string | null>(null)
  const [zeroStockTarget, setZeroStockTarget] = useState<StockItem | null>(null)
  const [zeroConfirming, setZeroConfirming] = useState(false)

  const [deleteStockTarget, setDeleteStockTarget] = useState<StockItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStock.expiry_date) return
    setAdding(true)
    try {
      await onAdd({ product_id: productId, expiry_date: newStock.expiry_date, quantity: parseInt(newStock.quantity) || 1 })
      setNewStock({ expiry_date: '', quantity: '1' })
      setShowAddStock(false)
    } finally {
      setAdding(false)
    }
  }

  const startEditStock = (stock: StockItem) => {
    setEditingStockId(stock.id)
    setEditStock({ expiry_date: stock.expiry_date, quantity: String(stock.quantity) })
  }

  const handleSaveStockEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStockId || !editStock.expiry_date) return
    setSavingEdit(true)
    try {
      await onUpdate(editingStockId, { expiry_date: editStock.expiry_date, quantity: parseInt(editStock.quantity) || 0 })
      setEditingStockId(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleZeroStock = async () => {
    if (!zeroStockTarget) return
    setZeroConfirming(true)
    setZeroingId(zeroStockTarget.id)
    try {
      await onUpdate(zeroStockTarget.id, { quantity: 0 })
      setZeroStockTarget(null)
    } finally {
      setZeroConfirming(false)
      setZeroingId(null)
    }
  }

  const handleDeleteStock = async () => {
    if (!deleteStockTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteStockTarget.id)
      setDeleteStockTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2"><Clock className="w-4 h-4" />Stok Kayitlari (SKT)</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowAddStock(!showAddStock)}><Plus className="w-4 h-4 mr-1" />SKT Ekle</Button>
      </div>

      {showAddStock && (
        <Card className="border-primary/30 mb-2">
          <CardContent className="p-3">
            <form onSubmit={handleAddStock} className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs">Son Kullanma Tarihi *</Label><Input type="date" value={newStock.expiry_date} onChange={(e) => setNewStock({ ...newStock, expiry_date: e.target.value })} className="h-10" required /></div>
              <div className="space-y-1.5"><Label className="text-xs">Adet</Label><Input type="number" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })} className="h-10" min="1" /></div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 h-10" disabled={adding}>{adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ekle'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddStock(false)} disabled={adding}>Iptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {stockItems.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center"><Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Henuz stok kaydi yok</p><p className="text-xs text-muted-foreground mt-1">SKT ekleyerek baslayin</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {[...stockItems]
            .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
            .map((stock) => {
              const info = getExpiryInfo(stock.expiry_date, getThresholds(shelfLifeType))
              const config = statusConfig[info.status]
              const isEditing = editingStockId === stock.id
              const isZeroing = zeroingId === stock.id
              return (
                <Card key={stock.id} className={`${config.bg} border ${config.border}`}>
                  <CardContent className="p-3">
                    {isEditing ? (
                      <form onSubmit={handleSaveStockEdit} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1"><Label className="text-xs">Son Kullanma Tarihi *</Label><Input type="date" value={editStock.expiry_date} onChange={(e) => setEditStock({ ...editStock, expiry_date: e.target.value })} className="h-10" required /></div>
                          <div className="space-y-1"><Label className="text-xs">Adet</Label><Input type="number" value={editStock.quantity} onChange={(e) => setEditStock({ ...editStock, quantity: e.target.value })} className="h-10" min="0" /></div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1" disabled={savingEdit}>
                            {savingEdit ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}Kaydet
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingStockId(null)} disabled={savingEdit}><X className="w-3.5 h-3.5 mr-1" />Iptal</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${config.badge} text-xs`}><Clock className="w-3 h-3 mr-1" />{info.label}</Badge>
                            <span className="text-xs text-muted-foreground">SKT: {formatDate(stock.expiry_date)}</span>
                            <Badge variant="outline" className="text-xs">Adet: {stock.quantity}</Badge>
                          </div>
                          {info.status !== 'safe' && <p className={`text-xs font-medium mt-1.5 ${config.text}`}>{info.actionRequired}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEditStock(stock)} title="Duzenle"><Pencil className="w-4 h-4" /></Button>
                          {stock.quantity > 0 && (
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" disabled={isZeroing} onClick={() => setZeroStockTarget(stock)} title="Stogu sifirla">
                              {isZeroing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Sifirla'}
                            </Button>
                          )}
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteStockTarget(stock)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      <DeleteDialog
        open={!!deleteStockTarget}
        onOpenChange={(open) => !open && setDeleteStockTarget(null)}
        onConfirm={handleDeleteStock}
        productName={`SKT: ${deleteStockTarget ? formatDate(deleteStockTarget.expiry_date) : ''}`}
        confirming={deleting}
      />

      <DeleteDialog
        open={!!zeroStockTarget}
        onOpenChange={(open) => !open && setZeroStockTarget(null)}
        onConfirm={handleZeroStock}
        productName={`SKT: ${zeroStockTarget ? formatDate(zeroStockTarget.expiry_date) : ''}`}
        title="Stogu Sifirla"
        description={
          <>
            Bu stok kaydinin adedi 0&apos;a dusurulecek (SKT: {zeroStockTarget ? formatDate(zeroStockTarget.expiry_date) : ''}).
          </>
        }
        confirmLabel="Stogu Sifirla"
        confirming={zeroConfirming}
      />
    </div>
  )
}

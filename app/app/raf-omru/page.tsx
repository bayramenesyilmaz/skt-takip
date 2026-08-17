'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Thermometer, Plus, Trash2, Save } from 'lucide-react'
import type { ShelfLifeType } from '@/lib/types'

interface RowState {
  name: string
  critical_days: string
  remove_days: string
  campaign_days: string
}

function toRowState(t: ShelfLifeType): RowState {
  return { name: t.name, critical_days: String(t.critical_days), remove_days: String(t.remove_days), campaign_days: String(t.campaign_days) }
}

export default function ShelfLifeTypesPage() {
  const { products, shelfLifeTypes, addShelfLifeType, updateShelfLifeType, deleteShelfLifeType } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [newRow, setNewRow] = useState<RowState>({ name: '', critical_days: '3', remove_days: '14', campaign_days: '90' })
  const [deleteTarget, setDeleteTarget] = useState<ShelfLifeType | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setRows((prev) => {
      const next = { ...prev }
      for (const t of shelfLifeTypes) {
        if (!next[t.id]) next[t.id] = toRowState(t)
      }
      return next
    })
  }, [shelfLifeTypes])

  const productCount = useMemo(() => {
    const m: Record<string, number> = {}
    products.forEach((p) => {
      if (p.shelf_life_type_id) m[p.shelf_life_type_id] = (m[p.shelf_life_type_id] || 0) + 1
    })
    return m
  }, [products])

  const handleSave = async (id: string) => {
    const row = rows[id]
    if (!row || !row.name.trim()) return
    setSaving(id)
    try {
      await updateShelfLifeType(id, {
        name: row.name.trim(),
        critical_days: parseInt(row.critical_days) || 0,
        remove_days: parseInt(row.remove_days) || 0,
        campaign_days: parseInt(row.campaign_days) || 0,
      })
    } finally {
      setSaving(null)
    }
  }

  const handleCreate = async () => {
    if (!newRow.name.trim()) return
    setCreating(true)
    try {
      await addShelfLifeType({
        name: newRow.name.trim(),
        critical_days: parseInt(newRow.critical_days) || 0,
        remove_days: parseInt(newRow.remove_days) || 0,
        campaign_days: parseInt(newRow.campaign_days) || 0,
      })
      setNewRow({ name: '', critical_days: '3', remove_days: '14', campaign_days: '90' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteShelfLifeType(deleteTarget.id)
      setDeleteTarget(null)
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
            <Link href="/app/ayarlar"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Thermometer className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Raf Omru Tipleri</h1>
              <p className="text-xs text-muted-foreground">Kategoriye gore kritik/kampanya gun esikleri</p>
            </div>
            <Badge variant="secondary" className="text-xs">{shelfLifeTypes.length}</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <Card className="border-primary/30">
          <CardContent className="p-3 space-y-3">
            <Label className="text-sm font-medium">Yeni Kategori Ekle</Label>
            <Input placeholder="ornek: +4 Dolap" value={newRow.name} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} className="h-10" />
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs">Kritik (gun)</Label><Input type="number" min="0" value={newRow.critical_days} onChange={(e) => setNewRow((r) => ({ ...r, critical_days: e.target.value }))} className="h-10" /></div>
              <div className="space-y-1"><Label className="text-xs">Kaldir (gun)</Label><Input type="number" min="0" value={newRow.remove_days} onChange={(e) => setNewRow((r) => ({ ...r, remove_days: e.target.value }))} className="h-10" /></div>
              <div className="space-y-1"><Label className="text-xs">Kampanya (gun)</Label><Input type="number" min="0" value={newRow.campaign_days} onChange={(e) => setNewRow((r) => ({ ...r, campaign_days: e.target.value }))} className="h-10" /></div>
            </div>
            <Button className="w-full h-10" disabled={!newRow.name.trim() || creating} onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />Kategori Ekle
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground px-1">
          Kritik gun: bu gun sayisi ve altinda urun &quot;acil&quot; sayilir. Kaldir gun: bu gune kadar raftan kaldirilmasi onerilir. Kampanya gun: bu gune kadar kampanya onerisi gosterilir. Bu esiklerin ustundeki urunler &quot;guvenli&quot; sayilir.
        </p>

        {shelfLifeTypes.length === 0 ? (
          <div className="text-center py-12">
            <Thermometer className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Kategori Yok</h3>
            <p className="text-sm text-muted-foreground">Yukaridan yeni bir raf omru tipi ekleyin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shelfLifeTypes.map((t) => {
              const row = rows[t.id] || toRowState(t)
              return (
                <Card key={t.id}>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={row.name}
                        onChange={(e) => setRows((prev) => ({ ...prev, [t.id]: { ...row, name: e.target.value } }))}
                        className="h-10 flex-1 font-medium"
                      />
                      <Badge variant="outline" className="text-xs shrink-0">{productCount[t.id] || 0} urun</Badge>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1"><Label className="text-xs">Kritik (gun)</Label><Input type="number" min="0" value={row.critical_days} onChange={(e) => setRows((prev) => ({ ...prev, [t.id]: { ...row, critical_days: e.target.value } }))} className="h-10" /></div>
                      <div className="space-y-1"><Label className="text-xs">Kaldir (gun)</Label><Input type="number" min="0" value={row.remove_days} onChange={(e) => setRows((prev) => ({ ...prev, [t.id]: { ...row, remove_days: e.target.value } }))} className="h-10" /></div>
                      <div className="space-y-1"><Label className="text-xs">Kampanya (gun)</Label><Input type="number" min="0" value={row.campaign_days} onChange={(e) => setRows((prev) => ({ ...prev, [t.id]: { ...row, campaign_days: e.target.value } }))} className="h-10" /></div>
                    </div>
                    <Button size="sm" variant="outline" disabled={saving === t.id} onClick={() => handleSave(t.id)}>
                      <Save className="w-3.5 h-3.5 mr-1" />{saving === t.id ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name || ''}
        title="Kategoriyi Sil"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> kategorisi silinecek. Bu kategoriyi kullanan urunler kategorisiz kalir (silinmezler).
          </>
        }
        confirmLabel="Sil"
      />

      <BottomNav />
    </main>
  )
}

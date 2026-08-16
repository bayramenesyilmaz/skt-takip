'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Layers, Plus, Package, Trash2 } from 'lucide-react'
import type { PalletWithItems } from '@/lib/types'

export default function PalletsPage() {
  const { pallets, addPallet, deletePallet } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PalletWithItems | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await addPallet({ name: newName.trim() })
      setNewName('')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deletePallet(deleteTarget.id)
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
          <div className="flex items-center gap-3 mb-3">
            <Link href="/app/ayarlar"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Paletler</h1>
              <p className="text-xs text-muted-foreground">Rayondaki paletleri yonetin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{pallets.length}</Badge>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Yeni palet adi..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-10 flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button className="h-10" disabled={!newName.trim() || creating} onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-1" />Ekle
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {pallets.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Palet Yok</h3>
            <p className="text-sm text-muted-foreground">Yukaridan yeni bir palet olusturun.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pallets.map((pallet) => {
              const itemCount = pallet.items?.length || 0
              const totalQty = pallet.items?.reduce((s, i) => s + i.quantity, 0) || 0
              return (
                <Card key={pallet.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Link href={`/app/palet?id=${pallet.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{pallet.name}</p>
                        <p className="text-xs text-muted-foreground">{itemCount} urun cesidi - {totalQty} adet</p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(pallet)}>
                      <Trash2 className="w-4 h-4" />
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
        title="Paleti Sil"
        description={
          <>
            <span className="font-medium text-foreground">{deleteTarget?.name}</span> paleti ve icindeki tum kayitlar silinecek. Emin misiniz?
          </>
        }
        confirmLabel="Sil"
      />

      <BottomNav />
    </main>
  )
}

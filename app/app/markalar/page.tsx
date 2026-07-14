"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { Tag, Plus, Trash2, Check, X, Package, RotateCcw } from 'lucide-react'
import type { Brand } from '@/lib/types'

export default function MarkalarPage() {
  const { profile } = useAuth()
  const storageMode = getStorageMode()
  const canDelete = profile?.role === 'super_admin' || profile?.role === 'owner' || profile?.role === 'branch_manager' || storageMode === 'local'

  const { brands, products, isLoading, addBrand, updateBrand, deleteBrand } = useAppData()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrandName.trim()) return
    addBrand({
      name: newBrandName.trim(),
      return_accepts: true,
    } as any)
    setNewBrandName('')
    setShowAddForm(false)
  }

  const handleToggleReturn = (brand: Brand) => {
    updateBrand(brand.id, { return_accepts: !brand.return_accepts })
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteBrand(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getBrandProductCount = (brandId: string) => {
    return products.filter(p => p.brand_id === brandId).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Markalar</h1>
                <p className="text-xs text-muted-foreground">İade durumu yönetimi</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              Yeni Marka
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {showAddForm && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleAddBrand} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Yeni Marka Ekle</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Marka Adı</Label>
                  <Input
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="örn: Pınar, Ülker, Eker"
                    className="h-10"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-10" disabled={!newBrandName.trim()}>
                  Ekle
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {brands.length === 0 && !showAddForm ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Henüz Marka Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Marka ekleyerek iade alma durumunu takip edebilirsiniz
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Marka Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <Card key={brand.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{brand.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {getBrandProductCount(brand.id)} ürün
                          </Badge>
                          <button
                            onClick={() => handleToggleReturn(brand)}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                              brand.return_accepts
                                ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3 inline mr-1" />
                            {brand.return_accepts ? 'İade Alır' : 'İade Almaz'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(brand)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

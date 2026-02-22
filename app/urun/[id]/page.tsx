"use client"

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { ArrowLeft, MapPin, Calendar, Edit2, Trash2, Clock } from 'lucide-react'
import type { Product } from '@/lib/types'

const statusConfig: Record<string, { bg: string; badge: string }> = {
  expired: { bg: 'bg-destructive/10', badge: 'bg-destructive' },
  critical: { bg: 'bg-destructive/5', badge: 'bg-destructive/90' },
  remove: { bg: 'bg-orange-500/10', badge: 'bg-orange-500' },
  campaign: { bg: 'bg-amber-500/10', badge: 'bg-amber-500' },
  safe: { bg: 'bg-emerald-500/10', badge: 'bg-emerald-500' },
}

export default function UrunPage() {
  const router = useRouter()
  const params = useParams()
  const { products, updateProduct, reduceProductToZero, locations } = useProductStore()
  
  const product = products.find(p => p.id === params.id)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | null>(null)

  if (!product) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ürün bulunamadı</p>
          <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
      </main>
    )
  }

  const info = getExpiryInfo(product.expiryDate)
  const config = statusConfig[info.status]

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getLocationName = (locationId?: string) => {
    if (!locationId) return null
    const loc = locations.find(l => l.id === locationId)
    if (!loc) return null
    const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : null
    return parent ? `${parent.name} / ${loc.name}` : loc.name
  }

  const handleEdit = () => {
    setEditData({
      name: product.name,
      stockCode: product.stockCode,
      barcode: product.barcode,
      expiryDate: product.expiryDate,
      locationId: product.locationId,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editData) {
      updateProduct(product.id, editData)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    reduceProductToZero(product.id)
    router.back()
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Ürün Detay</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Ana Bilgiler */}
        {!isEditing ? (
          <Card className={`${config.bg} border`}>
            <CardContent className="p-4 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${config.badge} text-white`}>
                    <Clock className="w-3 h-3 mr-1" />
                    {info.label}
                  </Badge>
                  <Badge variant="outline">{formatDate(product.expiryDate)}</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Ürün Adı</p>
                  <p className="font-medium text-foreground">{product.name}</p>
                </div>

                {product.stockCode && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Stok Kodu</p>
                    <p className="font-medium text-foreground">{product.stockCode}</p>
                  </div>
                )}

                {product.barcode && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Barkod</p>
                    <p className="font-medium text-foreground font-mono">{product.barcode}</p>
                  </div>
                )}

                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Son Kullanma Tarihi</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{formatDate(product.expiryDate)}</p>
                  </div>
                </div>

                {product.locationId && (
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Konum</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium text-foreground">{getLocationName(product.locationId)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleEdit}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  <Edit2 className="w-4 h-4" />
                  Düzenle
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Stok 0 Yap
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Edit Form */
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Ürün Adı</label>
                <Input
                  value={editData?.name || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Ürün adı"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stok Kodu</label>
                <Input
                  value={editData?.stockCode || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, stockCode: e.target.value } : null)}
                  placeholder="Stok kodu (opsiyonel)"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Barkod</label>
                <Input
                  value={editData?.barcode || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, barcode: e.target.value } : null)}
                  placeholder="Barkod (opsiyonel)"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Son Kullanma Tarihi</label>
                <Input
                  type="date"
                  value={editData?.expiryDate || ''}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, expiryDate: e.target.value } : null)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                >
                  Kaydet
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

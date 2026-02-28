'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/product-form'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { ArrowLeft, MapPin, Edit2, Trash2 } from 'lucide-react'
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
  const { products = [], updateProduct, reduceProductToZero, locations = [] } = useProductStore()

  const product = Array.isArray(products) ? products.find(p => p.id === params.id) : undefined
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      year: 'numeric',
    })
  }

  const getLocationHierarchy = (locationId?: string) => {
    if (!locationId) return null
    const loc = locations.find(l => l.id === locationId)
    if (!loc) return null
    const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : null
    return parent ? [parent.name, loc.name] : [loc.name]
  }

  const getProductLocations = () => {
    const prods = products.filter(p => p.locationId === product.locationId)
    return prods
  }

  const handleEditSubmit = (editData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProduct(product.id, editData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    reduceProductToZero(product.id)
    router.back()
  }

  const locationHierarchy = getLocationHierarchy(product.locationId)
  const productsInLocation = getProductLocations()

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1 ml-2">Ürün Detayı</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Ürün Bilgileri */}
        <Card className={config.bg}>
          <CardContent className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${config.badge} text-white`}>
                  {info.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {info.daysLeft} gün kaldı
                </span>
              </div>
            </div>

            {/* Bilgiler Tablosu */}
            <div className="space-y-2 border-t border-black/10 pt-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SKT</span>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(product.expiryDate)}
                </span>
              </div>
              {product.stockCode && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stok Kodu</span>
                  <span className="text-sm font-medium text-foreground">
                    {product.stockCode}
                  </span>
                </div>
              )}
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Barkod</span>
                  <span className="text-sm font-medium text-foreground">
                    {product.barcode}
                  </span>
                </div>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex gap-2 border-t border-black/10 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lokasyon Bilgisi */}
        {locationHierarchy && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Konum</h3>
              </div>
              <div className="space-y-1">
                {locationHierarchy.map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-foreground">{loc}</span>
                  </div>
                ))}
              </div>

              {productsInLocation.length > 1 && (
                <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                  Bu lokasyonda {productsInLocation.length} ürün var
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full max-w-lg bg-background p-4 rounded-t-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ürün Düzenle</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <ProductForm
              initialData={product}
              locations={locations}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">Ürünü Sil?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu ürünün stoku sıfırlanacak ve listede görünmeyecek.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

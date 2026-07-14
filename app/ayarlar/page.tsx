"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { useProductStore } from '@/hooks/use-product-store'
import { 
  Settings, 
  Trash2, 
  Database,
  Smartphone,
  Info,
  MapPin,
  Package
} from 'lucide-react'
import type { Product } from '@/lib/types'

export default function AyarlarPage() {
  const { products, locations, addProduct, clearAllProducts } = useProductStore()
  const [showForm, setShowForm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleClearAll = () => {
    clearAllProducts()
    setShowClearConfirm(false)
  }

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  if (showForm) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={handleAddProduct}
            onCancel={() => setShowForm(false)}
            locations={locations}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Ayarlar</h1>
              <p className="text-xs text-muted-foreground">Veri yonetimi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Veri Ozeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Toplam Urun</span>
              </div>
              <Badge variant="secondary" className="text-base px-3">
                {products.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Lokasyonlar</span>
              </div>
              <Badge variant="secondary" className="text-base px-3">
                {locations.length}
              </Badge>
            </div>
            
            <Link href="/lokasyonlar">
              <Button variant="outline" className="w-full mt-2">
                <MapPin className="w-4 h-4 mr-2" />
                Lokasyonlari Yonet
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Tehlikeli Bolge
            </CardTitle>
            <CardDescription className="text-sm">
              Bu islemler geri alinamaz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showClearConfirm ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowClearConfirm(true)}
                disabled={products.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tum Urunleri Sil ({products.length})
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive text-center font-medium">
                  Emin misiniz? {products.length} urun silinecek!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Vazgec
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleClearAll}
                  >
                    Evet, Sil
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Uygulama Bilgisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Versiyon</span>
              </div>
              <Badge variant="outline">2.0.0</Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p>
                Bu uygulama PWA formatindadir ve offline calisir.
                Ana ekrana ekleyerek uygulama gibi kullanabilirsiniz.
              </p>
              <p>
                Verileriniz cihazinizda guvenle saklanir.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

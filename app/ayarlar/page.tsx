"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { useProductStore } from '@/hooks/use-product-store'
import { 
  Settings, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  Database,
  Smartphone,
  Info
} from 'lucide-react'
import type { Product } from '@/lib/types'

export default function AyarlarPage() {
  const { products, addProduct, clearAll } = useProductStore()
  const [showForm, setShowForm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert('Tarayiciniz bildirimleri desteklemiyor.')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(prev => !prev)
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    } else {
      alert('Bildirim izni reddedildi. Tarayici ayarlarindan izin vermeniz gerekiyor.')
    }
  }

  const handleExport = () => {
    const data = JSON.stringify(products, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skt-takip-yedek-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text) as Product[]
        
        if (Array.isArray(data)) {
          let imported = 0
          for (const product of data) {
            if (product.name && product.stockCode && product.expiryDate) {
              addProduct({
                name: product.name,
                stockCode: product.stockCode,
                barcode: product.barcode || '',
                expiryDate: product.expiryDate,
              })
              imported++
            }
          }
          alert(`${imported} urun basariyla iceri aktarildi!`)
        }
      } catch {
        alert('Dosya okunamadi. Gecerli bir JSON dosyasi secin.')
      }
    }
    input.click()
  }

  const handleClearAll = () => {
    clearAll()
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
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ayarlar</h1>
              <p className="text-xs text-muted-foreground">
                Uygulama ayarlari ve veri yonetimi
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Bildirimler
            </CardTitle>
            <CardDescription className="text-sm">
              SKT uyarilari icin bildirim al
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm">
                Bildirimleri Etkinlestir
              </Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Veri Yonetimi
            </CardTitle>
            <CardDescription className="text-sm">
              Verilerinizi yedekleyin veya iceri aktarin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Toplam Urun</p>
                <p className="text-xs text-muted-foreground">Kayitli urun sayisi</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {products.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleExport}
                disabled={products.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Disa Aktar
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                Iceri Aktar
              </Button>
            </div>

            {!showClearConfirm ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowClearConfirm(true)}
                disabled={products.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tum Verileri Sil
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive text-center font-medium">
                  Emin misiniz? Bu islem geri alinamaz!
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
          <CardHeader className="pb-3">
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
              <Badge variant="outline">1.0.0</Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Bu uygulama PWA (Progressive Web App) formatindadir. 
                Ana ekrana ekleyerek uygulama gibi kullanabilirsiniz.
              </p>
              <p>
                Verileriniz yerel olarak cihazinizda saklanir.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

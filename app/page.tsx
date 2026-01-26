"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/product-form'
import { ProductCard } from '@/components/product-card'
import { StatsCards } from '@/components/stats-cards'
import { EmptyState } from '@/components/empty-state'
import { InstallPrompt } from '@/components/install-prompt'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Package, Bell, BellOff, ChevronRight, AlertTriangle, ClipboardPaste } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function Home() {
  const { products, isLoading, addProduct, addBulkProducts, updateProduct, deleteProduct } = useProductStore()
  
  const [showForm, setShowForm] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  // Check for expiring products and send notifications
  useEffect(() => {
    if (!notificationsEnabled || products.length === 0) return

    const checkExpiry = () => {
      const criticalProducts = products.filter(
        p => ['expired', 'critical', 'remove'].includes(getExpiryInfo(p.expiryDate).status)
      )

      if (criticalProducts.length > 0) {
        new Notification('SKT Takip - Dikkat!', {
          body: `${criticalProducts.length} urunun son kullanma tarihi yaklasiyor veya gecmis!`,
          icon: '/icon-192.png',
          tag: 'expiry-alert',
        })
      }
    }

    const now = new Date()
    const scheduledTime = new Date(now)
    scheduledTime.setHours(9, 0, 0, 0)
    
    if (now > scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }

    const timeout = setTimeout(checkExpiry, scheduledTime.getTime() - now.getTime())
    checkExpiry()

    return () => clearTimeout(timeout)
  }, [notificationsEnabled, products])

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

  // Get urgent products (expired + critical + remove) - only show top 5
  const urgentProducts = useMemo(() => {
    return products
      .filter(p => {
        const info = getExpiryInfo(p.expiryDate)
        return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 5)
  }, [products])

  // Get campaign products - only show top 3
  const campaignProducts = useMemo(() => {
    return products
      .filter(p => getExpiryInfo(p.expiryDate).status === 'campaign')
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
      .slice(0, 3)
  }, [products])

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  const handleBulkAdd = (parsedProducts: import('@/lib/types').ParsedProduct[]) => {
    addBulkProducts(parsedProducts)
    setShowBulkAdd(false)
  }

  const handleUpdateProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product)
      setEditingProduct(null)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  if (showForm || editingProduct) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}
            initialData={editingProduct || undefined}
          />
        </div>
      </main>
    )
  }

  if (showBulkAdd) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <BulkProductAdd
            onAdd={handleBulkAdd}
            onCancel={() => setShowBulkAdd(false)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SKT Takip</h1>
                <p className="text-xs text-muted-foreground">Son Kullanma Tarihi Yonetimi</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowBulkAdd(true)}
                className="text-muted-foreground hover:text-primary"
                title="Toplu Urun Ekle"
              >
                <ClipboardPaste className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNotificationToggle}
                className={notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Welcome Message for Empty State */}
        {products.length === 0 ? (
          <EmptyState onAddProduct={() => setShowForm(true)} />
        ) : (
          <>
            {/* Stats Overview */}
            <StatsCards products={products} />

            {/* Urgent Products Section */}
            {urgentProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <h2 className="font-semibold text-foreground">Acil Dikkat Gereken</h2>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {products.filter(p => {
                      const info = getExpiryInfo(p.expiryDate)
                      return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
                    }).length} urun
                  </Badge>
                </div>
                <div className="space-y-3">
                  {urgentProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const product = products.find(p => p.id === id)
                        if (product) setDeleteTarget(product)
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Campaign Products Section */}
            {campaignProducts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">Kampanya Onerisi</h2>
                  <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                    {products.filter(p => getExpiryInfo(p.expiryDate).status === 'campaign').length} urun
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Bu urunler icin yetkiliye bilgi verin - kampanya yapilabilir
                </p>
                <div className="space-y-3">
                  {campaignProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setEditingProduct}
                      onDelete={(id) => {
                        const product = products.find(p => p.id === id)
                        if (product) setDeleteTarget(product)
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Quick Link to Full List */}
            <Link href="/liste">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Tum Urunleri Gor</p>
                    <p className="text-sm text-muted-foreground">
                      {products.length} urun SKT sirasina gore listelendi
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowForm(true)} />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

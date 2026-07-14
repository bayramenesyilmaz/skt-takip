'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import {
  getStorageMode,
  setStorageMode,
  resetRepositoryCache,
} from '@/lib/repositories/repository.factory'
import { getExpiryInfo, formatDate } from '@/lib/expiry'
import { StatsCards } from '@/components/stats-cards'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Upload, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

export default function AppHomePage() {
  const { user, profile, organization, signOut } = useAuth()
  const {
    products,
    locations,
    brands,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    campaignSuggestions,
  } = useAppData()

  const [storageMode, setStorageModeState] = useState(getStorageMode())
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const canDelete =
    profile?.role === 'super_admin' ||
    profile?.role === 'owner' ||
    profile?.role === 'branch_manager' ||
    storageMode === 'local'

  const urgentProducts = useMemo(() => {
    return products
      .map((p: any) => ({ ...p, expiry: getExpiryInfo(p.expiryDate) }))
      .filter((p: any) =>
        ['expired', 'critical', 'remove'].includes(p.expiry.status)
      )
      .sort((a: any, b: any) => a.expiry.daysLeft - b.expiry.daysLeft)
  }, [products])

  const handleStorageChange = (mode: 'local' | 'remote') => {
    setStorageMode(mode)
    setStorageModeState(mode)
    resetRepositoryCache()
  }

  const handleFormSubmit = async (data: any) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data)
    } else {
      await addProduct(data)
    }
    setFormOpen(false)
    setEditingProduct(null)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">
              {organization?.name || 'Organizasyon'}
            </h1>
            <p className="text-xs text-gray-500">
              {profile?.role} - {profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/import">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" /> Import
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <StatsCards products={products} />

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Acil Urunler</h2>
            <Link href="/app/liste">
              <Button variant="ghost" size="sm">
                Tumunu Gor
              </Button>
            </Link>
          </div>
          {urgentProducts.length === 0 ? (
            <p className="text-sm text-gray-500">Acil urun yok.</p>
          ) : (
            <div className="space-y-2">
              {urgentProducts.slice(0, 5).map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(p.expiryDate)} - {p.expiry.label}
                    </p>
                  </div>
                  <Badge variant={p.expiry.status === 'expired' ? 'destructive' : 'secondary'}>
                    {p.expiry.daysLeft} gun
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {campaignSuggestions?.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Kampanya Onerileri</h2>
            <div className="space-y-2">
              {campaignSuggestions.map((c: any, i: number) => (
                <div key={i} className="p-2 border rounded bg-amber-50">
                  <p className="text-sm font-medium">{c.productName}</p>
                  <p className="text-xs text-gray-600">{c.suggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Veri Modu</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={storageMode === 'local' ? 'default' : 'outline'}
              onClick={() => handleStorageChange('local')}
            >
              Local
            </Button>
            <Button
              size="sm"
              variant={storageMode === 'remote' ? 'default' : 'outline'}
              onClick={() => handleStorageChange('remote')}
            >
              Remote
            </Button>
          </div>
        </Card>
      </main>

      {formOpen && (
        <ProductForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormOpen(false)
            setEditingProduct(null)
          }}
          initialData={editingProduct}
          locations={locations}
          brands={brands}
        />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        productName={deleteTarget?.name}
      />

      <BottomNav onAddClick={() => { setEditingProduct(null); setFormOpen(true) }} />
    </div>
  )
}

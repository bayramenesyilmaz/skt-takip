'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { getExpiryInfo } from '@/lib/expiry'
import { ProductCard } from '@/components/product-card'
import { ProductForm } from '@/components/product-form'
import { DeleteDialog } from '@/components/delete-dialog'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

type StatusFilter = 'all' | 'expired' | 'critical' | 'remove' | 'campaign' | 'safe'

export default function ProductListPage() {
  const { profile } = useAuth()
  const {
    products,
    locations,
    brands,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useAppData()

  const storageMode = getStorageMode()
  const canDelete =
    profile?.role === 'super_admin' ||
    profile?.role === 'owner' ||
    profile?.role === 'branch_manager' ||
    storageMode === 'local'

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const productsWithExpiry = useMemo(() => {
    return products.map((p: any) => ({ ...p, expiry: getExpiryInfo(p.expiryDate) }))
  }, [products])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length, expired: 0, critical: 0, remove: 0, campaign: 0, safe: 0 }
    productsWithExpiry.forEach((p: any) => {
      c[p.expiry.status] = (c[p.expiry.status] || 0) + 1
    })
    return c
  }, [productsWithExpiry])

  const filtered = useMemo(() => {
    return productsWithExpiry
      .filter((p: any) => {
        if (filter !== 'all' && p.expiry.status !== filter) return false
        if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a: any, b: any) => a.expiry.daysLeft - b.expiry.daysLeft)
  }, [productsWithExpiry, filter, search])

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

  const filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tumu' },
    { key: 'expired', label: 'Suresi Gecti' },
    { key: 'critical', label: 'Kritik' },
    { key: 'remove', label: 'Cikar' },
    { key: 'campaign', label: 'Kampanya' },
    { key: 'safe', label: 'Guvenli' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Urun Listesi</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Urun ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}>
              <Badge variant={filter === f.key ? 'default' : 'outline'}>
                {f.label} ({counts[f.key] || 0})
              </Badge>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card className="p-4 text-center text-sm text-gray-500">
              Urun bulunamadi.
            </Card>
          ) : (
            filtered.map((p: any) => (
              <Link key={p.id} href={`/app/urun?id=${p.id}`}>
                <ProductCard
                  product={p}
                  onEdit={(prod) => { setEditingProduct(prod); setFormOpen(true) }}
                  onDelete={(prod) => setDeleteTarget(prod)}
                  canDelete={canDelete}
                />
              </Link>
            ))
          )}
        </div>
      </main>

      {formOpen && (
        <ProductForm
          onSubmit={handleFormSubmit}
          onCancel={() => { setFormOpen(false); setEditingProduct(null) }}
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

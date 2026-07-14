"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/product-form'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, FileText } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'

export default function EklePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const { addProduct, locations, brands } = useAppData()

  const handleAddProduct = (product: Omit<ProductWithStock, 'id' | 'created_at' | 'updated_at'>) => {
    addProduct(product as any)
    router.push('/app/liste')
  }

  const handleBulkAdd = (products: { name: string; expiryDate: string; isValid: boolean }[]) => {
    for (const p of products.filter(p => p.isValid)) {
      addProduct(p as any)
    }
    router.push('/app/liste')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">Ürün Ekle</h1>
            </div>
          </div>
        </header>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'single'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="w-4 h-4" />
              Tekli
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'bulk'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Toplu
            </button>
          </div>

          {activeTab === 'single' ? (
            <ProductForm
              onSubmit={handleAddProduct}
              onCancel={() => router.back()}
              locations={locations}
              brands={brands}
            />
          ) : (
            <BulkProductAdd
              onAdd={handleBulkAdd as any}
              onCancel={() => router.back()}
            />
          )}
        </div>
      </div>
    </main>
  )
}

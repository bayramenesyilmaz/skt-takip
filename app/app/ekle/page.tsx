'use client'

import { useAppData } from '@/hooks/use-app-data'
import { ProductForm } from '@/components/product-form'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Package, Layers } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function AddProductPage() {
  const { brands, addProduct, bulkAddProducts } = useAppData()
  const [tab, setTab] = useState<'single' | 'bulk'>('single')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-semibold text-lg">Urun Ekle</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <Button
            variant={tab === 'single' ? 'default' : 'outline'}
            onClick={() => setTab('single')}
          >
            <Package className="w-4 h-4 mr-1" /> Tekil
          </Button>
          <Button
            variant={tab === 'bulk' ? 'default' : 'outline'}
            onClick={() => setTab('bulk')}
          >
            <Layers className="w-4 h-4 mr-1" /> Toplu
          </Button>
        </div>

        {tab === 'single' ? (
          <ProductForm
            onSubmit={async (data) => { await addProduct(data) }}
            onCancel={() => {}}
            brands={brands}
          />
        ) : (
          <BulkProductAdd
            onAdd={async (items) => { await bulkAddProducts(items) }}
            onCancel={() => {}}
          />
        )}
      </main>
    </div>
  )
}

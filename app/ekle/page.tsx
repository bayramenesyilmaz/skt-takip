"use client"

import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/product-form'
import { BulkProductAdd } from '@/components/bulk-product-add'
import { useProductStore } from '@/hooks/use-product-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Package, FileText } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function EklePage() {
  const router = useRouter()
  const { addProduct, addBulkProducts, locations } = useProductStore()

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    router.push('/liste')
  }

  const handleBulkAdd = (products: { name: string; expiryDate: string; isValid: boolean }[]) => {
    addBulkProducts(products)
    router.push('/liste')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">Urun Ekle</h1>
            </div>
          </div>
        </header>

        <div className="p-4">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Tekli
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Toplu
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <ProductForm
                onSubmit={handleAddProduct}
                onCancel={() => router.back()}
                locations={locations}
              />
            </TabsContent>
            
            <TabsContent value="bulk">
              <BulkProductAdd
                onAdd={handleBulkAdd}
                onCancel={() => router.back()}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

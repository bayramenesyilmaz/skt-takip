"use client"

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ProductForm } from '@/components/product-form'
import { StockItemsManager } from '@/components/stock-items-manager'
import { Card, CardContent } from '@/components/ui/card'
import type { Product, Brand, ShelfLifeType, ProductWithStock, StockItem } from '@/lib/types'

interface ProductEditDialogProps {
  product: ProductWithStock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  brands: Brand[]
  shelfLifeTypes: ShelfLifeType[]
  onSave: (productId: string, updates: Partial<Product>) => Promise<void>
  onAddStock: (data: { product_id: string; expiry_date: string; quantity: number }) => Promise<unknown>
  onUpdateStock: (stockId: string, data: Partial<StockItem>) => Promise<unknown>
  onDeleteStock: (stockId: string) => Promise<unknown>
}

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
  brands,
  shelfLifeTypes,
  onSave,
  onAddStock,
  onUpdateStock,
  onDeleteStock,
}: ProductEditDialogProps) {
  if (!product) return null

  const handleSubmit = async (data: Partial<Product> & { expiryDate?: string }) => {
    await onSave(product.id, {
      name: data.name,
      stock_code: data.stock_code,
      barcode: data.barcode,
      brand_id: data.brand_id,
      shelf_life_type_id: data.shelf_life_type_id,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Urunu Duzenle</DialogTitle>
        <ProductForm
          initialData={product}
          brands={brands}
          shelfLifeTypes={shelfLifeTypes}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
        <Card className="border-0 shadow-lg mt-3">
          <CardContent className="p-4">
            <StockItemsManager
              productId={product.id}
              stockItems={product.stock_items || []}
              shelfLifeType={product.shelf_life_type}
              onAdd={onAddStock}
              onUpdate={onUpdateStock}
              onDelete={onDeleteStock}
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

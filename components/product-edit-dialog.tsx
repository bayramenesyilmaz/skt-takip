"use client"

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ProductForm } from '@/components/product-form'
import type { Product, Brand, ShelfLifeType, ProductWithStock } from '@/lib/types'

interface ProductEditDialogProps {
  product: ProductWithStock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  brands: Brand[]
  shelfLifeTypes: ShelfLifeType[]
  onSave: (productId: string, updates: Partial<Product>) => Promise<void>
}

export function ProductEditDialog({ product, open, onOpenChange, brands, shelfLifeTypes, onSave }: ProductEditDialogProps) {
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
      <DialogContent className="p-0 border-0 bg-transparent shadow-none" showCloseButton={false}>
        <DialogTitle className="sr-only">Urunu Duzenle</DialogTitle>
        <ProductForm
          initialData={product}
          brands={brands}
          shelfLifeTypes={shelfLifeTypes}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

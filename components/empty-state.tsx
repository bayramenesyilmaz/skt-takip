"use client"

import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onAddProduct: () => void
}

export function EmptyState({ onAddProduct }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Henüz ürün yok
      </h3>
      <p className="text-muted-foreground mb-6 max-w-xs">
        Son kullanma tarihi takibi yapmak için ilk ürününüzü ekleyin.
      </p>
      <Button onClick={onAddProduct} className="gap-2">
        <Plus className="w-5 h-5" />
        İlk Ürünü Ekle
      </Button>
    </div>
  )
}

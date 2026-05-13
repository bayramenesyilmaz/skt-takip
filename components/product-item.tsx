"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getExpiryInfoByType } from '@/hooks/use-product-store'
import { Clock, ChevronRight, Trash2, Snowflake, Thermometer, Package, Edit2 } from 'lucide-react'
import type { Product, ExpiryStatus, ProductType } from '@/lib/types'

const statusConfig: Record<ExpiryStatus, { bg: string; badge: string; border: string }> = {
  expired: { bg: 'bg-red-50', badge: 'bg-red-500', border: 'border-red-200' },
  critical: { bg: 'bg-orange-50', badge: 'bg-orange-500', border: 'border-orange-200' },
  remove: { bg: 'bg-amber-50', badge: 'bg-amber-500', border: 'border-amber-200' },
  campaign: { bg: 'bg-blue-50', badge: 'bg-blue-500', border: 'border-blue-200' },
  safe: { bg: 'bg-green-50', badge: 'bg-green-500', border: 'border-green-200' },
}

const typeConfig: Record<ProductType, { icon: typeof Package; label: string; color: string }> = {
  shelf: { icon: Package, label: 'Raf', color: 'bg-slate-100 text-slate-600' },
  'freezer-18': { icon: Snowflake, label: '-18C', color: 'bg-cyan-100 text-cyan-700' },
  'fridge-4': { icon: Thermometer, label: '+4C', color: 'bg-purple-100 text-purple-700' },
  processed: { icon: Package, label: 'Islenmis', color: 'bg-yellow-100 text-yellow-700' },
}

interface ProductItemProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (id: string) => void
  showEdit?: boolean
  showDelete?: boolean
}

export function ProductItem({ product, onEdit, onDelete, showEdit = true, showDelete = true }: ProductItemProps) {
  const info = getExpiryInfoByType(product.expiryDate, product.productType)
  const config = statusConfig[info.status]
  const typeInfo = typeConfig[product.productType || 'shelf']
  const TypeIcon = typeInfo.icon

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const content = (
    <Card className={`${config.bg} ${config.border} border transition-shadow hover:shadow-md`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className={`${config.badge} text-white text-xs px-1.5 py-0`}>
                <Clock className="w-3 h-3 mr-0.5" />
                {info.label}
              </Badge>
              
              <Badge className={`${typeInfo.color} text-xs px-1.5 py-0`}>
                <TypeIcon className="w-3 h-3 mr-0.5" />
                {typeInfo.label}
              </Badge>
              
              {product.brand && (
                <span className="text-xs text-muted-foreground">{product.brand}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>SKT: {formatDate(product.expiryDate)}</span>
              {product.stockCode && product.stockCode !== '1' && product.stockCode !== '0' && (
                <span>Stok: {product.stockCode}</span>
              )}
              {product.barcode && (
                <span>#{product.barcode}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {showEdit && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit(product)
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(product.id)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return content
}

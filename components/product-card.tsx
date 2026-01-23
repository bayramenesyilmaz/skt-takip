"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Clock, Hash, Barcode as BarcodeIcon } from 'lucide-react'
import { getExpiryInfo } from '@/hooks/use-product-store'
import type { Product, ExpiryStatus } from '@/lib/types'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<ExpiryStatus, { 
  bg: string
  text: string
  border: string
  badge: string
}> = {
  expired: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    badge: 'bg-destructive text-destructive-foreground',
  },
  critical: {
    bg: 'bg-destructive/5',
    text: 'text-destructive',
    border: 'border-destructive/20',
    badge: 'bg-destructive/90 text-destructive-foreground',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-500',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-amber-950',
  },
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-500',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-emerald-950',
  },
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const expiryInfo = getExpiryInfo(product.expiryDate)
  const config = statusConfig[expiryInfo.status]
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <Card className={`${config.bg} border ${config.border} overflow-hidden transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate mb-2">
              {product.name}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="text-xs font-normal">
                <Hash className="w-3 h-3 mr-1" />
                {product.stockCode}
              </Badge>
              {product.barcode && (
                <Badge variant="secondary" className="text-xs font-normal">
                  <BarcodeIcon className="w-3 h-3 mr-1" />
                  {product.barcode}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`${config.badge} text-xs`}>
                <Clock className="w-3 h-3 mr-1" />
                {expiryInfo.label}
              </Badge>
              <span className={`text-xs ${config.text}`}>
                SKT: {formatDate(product.expiryDate)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(product)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

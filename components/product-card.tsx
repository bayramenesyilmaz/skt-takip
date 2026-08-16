"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Clock } from 'lucide-react'
import { getExpiryInfo, statusConfig, formatDate } from '@/lib/expiry'
import type { ProductWithStock } from '@/lib/types'

interface ProductCardProps {
  product: ProductWithStock
  onEdit: (product: ProductWithStock) => void
  onDelete: (id: string) => void
  compact?: boolean
  canDelete?: boolean
}

export function ProductCard({ product, onEdit, onDelete, compact, canDelete = true }: ProductCardProps) {
  const earliestStock = product.stock_items && product.stock_items.length > 0
    ? [...product.stock_items].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())[0]
    : undefined
  const expiryInfo = earliestStock ? getExpiryInfo(earliestStock.expiry_date) : null
  const config = expiryInfo ? statusConfig[expiryInfo.status] : statusConfig.safe
  const totalQty = product.stock_items?.reduce((sum, s) => sum + s.quantity, 0) || 0
  const distinctExpiryCount = new Set(product.stock_items?.map((s) => s.expiry_date)).size

  return (
    <Card className={`${config.bg} border ${config.border} overflow-hidden`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-foreground truncate ${compact ? 'text-sm' : 'text-base'}`}>{product.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {expiryInfo && <Badge className={`${config.badge} text-xs px-2 py-0`}><Clock className="w-3 h-3 mr-1" />{expiryInfo.label}</Badge>}
              {earliestStock && <span className="text-xs text-muted-foreground">SKT: {formatDate(earliestStock.expiry_date)}</span>}
              {totalQty > 0 && <span className="text-xs text-muted-foreground">Stok: {totalQty}</span>}
              {distinctExpiryCount > 1 && <Badge variant="outline" className="text-xs px-1.5 py-0">{distinctExpiryCount} SKT</Badge>}
            </div>
            {product.brand && <span className="text-xs text-muted-foreground mt-1 inline-block">Marka: {product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}</span>}
            {expiryInfo && expiryInfo.status !== 'safe' && !compact && <p className={`text-xs font-medium mt-2 ${config.text}`}>{expiryInfo.actionRequired}</p>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(product) }}><Edit className="w-4 h-4" /></Button>
            {canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product.id) }}><Trash2 className="w-4 h-4" /></Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

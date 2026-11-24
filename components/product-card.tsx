"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Clock, Undo2 } from 'lucide-react'
import { getExpiryInfo, getThresholds, statusConfig, formatDate } from '@/lib/expiry'
import type { ProductWithStock } from '@/lib/types'

interface ProductCardProps {
  product: ProductWithStock
  onEdit?: (product: ProductWithStock) => void
  onDelete?: (id: string) => void
  onReturn?: (product: ProductWithStock) => void
  compact?: boolean
  canDelete?: boolean
  /** Shows each active stock row (SKT + adet) instead of just the earliest one. */
  showStockBreakdown?: boolean
  palletInfo?: { name: string; quantity: number }[]
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onReturn,
  compact,
  canDelete = true,
  showStockBreakdown,
  palletInfo,
}: ProductCardProps) {
  const thresholds = getThresholds(product.shelf_life_type)
  const activeStock = (product.stock_items || []).filter((s) => s.quantity > 0)
  const sortedStock = [...activeStock].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  const earliestStock = sortedStock[0]
  const expiryInfo = earliestStock ? getExpiryInfo(earliestStock.expiry_date, thresholds) : null
  const config = expiryInfo ? statusConfig[expiryInfo.status] : statusConfig.safe
  const totalQty = product.total_quantity ?? product.stock_items?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
  const distinctExpiryCount = new Set(product.stock_items?.map((s) => s.expiry_date)).size
  const hasActions = !!(onReturn || onEdit || (canDelete && onDelete))

  return (
    <Card className={`${config.bg} border ${config.border} overflow-hidden`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-foreground truncate ${compact ? 'text-sm' : 'text-base'}`}>{product.name}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {expiryInfo && <Badge className={`${config.badge} text-xs px-2 py-0`}><Clock className="w-3 h-3 mr-1" />{expiryInfo.label}</Badge>}
              {earliestStock && <span className="text-xs text-muted-foreground">SKT: {formatDate(earliestStock.expiry_date)}</span>}
              {totalQty > 0 ? (
                <span className="text-xs text-muted-foreground">Stok: {totalQty}</span>
              ) : (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">Stok: 0</Badge>
              )}
              {distinctExpiryCount > 1 && <Badge variant="outline" className="text-xs px-1.5 py-0">{distinctExpiryCount} SKT</Badge>}
              {!product.barcode && <Badge variant="outline" className="text-xs px-1.5 py-0">Barkod yok</Badge>}
              {product.on_shelf === false && <Badge variant="destructive" className="text-xs px-1.5 py-0">Rafta Yok</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {product.stock_code && <span className="text-xs text-muted-foreground">Stok Kodu: {product.stock_code}</span>}
              {product.brand && <span className="text-xs text-muted-foreground">Marka: {product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}</span>}
              {product.shelf_life_type && <span className="text-xs text-muted-foreground">{product.shelf_life_type.name}</span>}
            </div>
            {expiryInfo && expiryInfo.status !== 'safe' && !compact && <p className={`text-xs font-medium mt-2 ${config.text}`}>{expiryInfo.actionRequired}</p>}
          </div>
          {hasActions && (
            <div className="flex gap-1 shrink-0">
              {onReturn && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReturn(product) }} title="Iade"><Undo2 className="w-4 h-4" /></Button>}
              {onEdit && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(product) }} title="Duzenle"><Edit className="w-4 h-4" /></Button>}
              {canDelete && onDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product.id) }} title="Sil"><Trash2 className="w-4 h-4" /></Button>}
            </div>
          )}
        </div>

        {showStockBreakdown && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
            {sortedStock.length > 0 ? (
              <div className="space-y-1.5">
                {sortedStock.slice(0, 5).map((stock) => {
                  const sInfo = getExpiryInfo(stock.expiry_date, thresholds)
                  const sConfig = statusConfig[sInfo.status]
                  return (
                    <div key={stock.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/80">
                      <span className="text-xs text-foreground flex-1 min-w-0">SKT: {formatDate(stock.expiry_date)}</span>
                      <span className="text-xs text-muted-foreground">Adet: {stock.quantity}</span>
                      <Badge className={`${sConfig.badge} text-xs px-1.5 py-0`}>{sInfo.label}</Badge>
                    </div>
                  )
                })}
                {sortedStock.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{sortedStock.length - 5} kayit daha (detay sayfasinda)</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Bu urunun aktif stogu yok. Guncelleyerek yeni SKT girebilirsiniz.</p>
            )}

            {palletInfo && palletInfo.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Paletler:</span>
                {palletInfo.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{p.name} ({p.quantity})</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

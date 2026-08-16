"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { getExpiryInfo, statusConfig, formatDate } from '@/lib/expiry'
import type { ProductWithStock } from '@/lib/types'

interface ProductSearchCardProps {
  product: ProductWithStock
  palletInfo?: { name: string; quantity: number }[]
}

export function ProductSearchCard({ product, palletInfo }: ProductSearchCardProps) {
  const sortedStock = [...(product.stock_items || [])]
    .filter((s) => s.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  const earliest = sortedStock[0]
  const isZeroStock = (product.total_quantity ?? 0) === 0
  const info = earliest ? getExpiryInfo(earliest.expiry_date) : null
  const config = info ? statusConfig[info.status] : statusConfig.safe

  return (
    <Card className={`${config.bg} border ${config.border}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
              {product.brand && (
                <span className="text-xs text-muted-foreground">
                  {product.brand.name}{!product.brand.return_accepts && ' (iade almaz)'}
                </span>
              )}
            </div>
            {isZeroStock ? (
              <Badge variant="destructive" className="text-xs shrink-0">Stok: 0</Badge>
            ) : (
              info && (
                <Badge className={`${config.badge} text-white text-xs shrink-0`}>
                  <Clock className="w-3 h-3 mr-1" />{info.label}
                </Badge>
              )
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {earliest && <span>SKT: {formatDate(earliest.expiry_date)}</span>}
            {product.stock_code && <span>Stok Kodu: {product.stock_code}</span>}
            {product.barcode ? <span>Barkod: {product.barcode}</span> : <Badge variant="outline" className="text-xs">Barkod yok</Badge>}
          </div>

          {sortedStock.length > 0 ? (
            <div className="space-y-1.5">
              {sortedStock.slice(0, 5).map((stock) => {
                const sInfo = getExpiryInfo(stock.expiry_date)
                const sConfig = statusConfig[sInfo.status]
                return (
                  <div key={stock.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/80">
                    <span className="text-xs text-foreground flex-1 min-w-0">SKT: {formatDate(stock.expiry_date)}</span>
                    <span className="text-xs text-muted-foreground">Adet: {stock.quantity}</span>
                    <Badge className={`${sConfig.badge} text-xs px-1.5 py-0`}>
                      {sInfo.label}
                    </Badge>
                  </div>
                )
              })}
              {sortedStock.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{sortedStock.length - 5} kayit daha (detay sayfasinda)
                </p>
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

          {info && info.status !== 'safe' && !isZeroStock && (
            <p className={`text-xs font-medium ${config.text}`}>{info.actionRequired}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

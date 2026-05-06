'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getExpiryInfoByType } from '@/hooks/use-product-store'
import { Clock, ChevronRight, Edit2, Trash2, Snowflake, Thermometer, Zap } from 'lucide-react'
import type { Product } from '@/lib/types'

interface ProductCardItemProps {
  product: Product
  showActions?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (id: string) => void
  onClick?: () => void
}

const statusConfig: Record<string, { bg: string; badge: string }> = {
  expired: { bg: 'bg-destructive/10', badge: 'bg-destructive' },
  critical: { bg: 'bg-destructive/5', badge: 'bg-destructive/90' },
  remove: { bg: 'bg-orange-500/10', badge: 'bg-orange-500' },
  campaign: { bg: 'bg-amber-500/10', badge: 'bg-amber-500' },
  safe: { bg: 'bg-emerald-500/10', badge: 'bg-emerald-500' },
}

const typeConfig: Record<string, { icon: typeof Snowflake; label: string; color: string }> = {
  shelf: { icon: Zap, label: 'Normal Raf', color: 'bg-blue-100 text-blue-700' },
  'freezer-18': { icon: Snowflake, label: '-18°C', color: 'bg-cyan-100 text-cyan-700' },
  'fridge-4': { icon: Thermometer, label: '+4°C', color: 'bg-purple-100 text-purple-700' },
  processed: { icon: Zap, label: 'İşlenmiş', color: 'bg-yellow-100 text-yellow-700' },
}

export function ProductCardItem({
  product,
  showActions = false,
  onEdit,
  onDelete,
  onClick,
}: ProductCardItemProps) {
  const info = getExpiryInfoByType(product.expiryDate, product.productType)
  const config = statusConfig[info.status]
  const typeInfo = typeConfig[product.productType || 'shelf']
  const TypeIcon = typeInfo.icon

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const cardContent = (
    <Card className={`${config.bg} border transition-shadow hover:shadow-md`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`${config.badge} text-white text-xs`}>
                <Clock className="w-3 h-3 mr-1" />
                {info.label}
              </Badge>
              <Badge className={`${typeInfo.color} text-xs font-medium`}>
                <TypeIcon className="w-3 h-3 mr-0.5" />
                {typeInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(product.expiryDate)}
              </span>
            </div>
          </div>
          {!showActions && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-black/10">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(product)
              }}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Düzenle
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(product.id)
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Sil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (showActions) {
    return <div onClick={onClick}>{cardContent}</div>
  }

  return (
    <Link href={`/urun/${product.id}`} onClick={onClick}>
      {cardContent}
    </Link>
  )
}

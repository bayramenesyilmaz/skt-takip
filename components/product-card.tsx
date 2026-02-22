"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Clock, MapPin, Copy } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onReduceToZero?: (id: string) => void
  locationName?: string
  compact?: boolean
  showStockButton?: boolean
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
  remove: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500 text-white',
  },
  campaign: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-white',
  },
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
  },
}

export function ProductCard({ 
  product, 
  onEdit, 
  onDelete, 
  onReduceToZero,
  locationName, 
  compact,
  showStockButton
}: ProductCardProps) {
  const expiryInfo = getExpiryInfo(product.expiryDate)
  const config = statusConfig[expiryInfo.status]
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Card className={`${config.bg} border ${config.border} overflow-hidden`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-foreground truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge className={`${config.badge} text-xs px-2 py-0`}>
                <Clock className="w-3 h-3 mr-1" />
                {expiryInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(product.expiryDate)}
              </span>
            </div>
            
            {locationName && (
              <div className="flex items-center gap-1 mt-1.5">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{locationName}</span>
              </div>
            )}
            
            {expiryInfo.status !== 'safe' && !compact && (
              <p className={`text-xs font-medium mt-2 ${config.text}`}>
                {expiryInfo.actionRequired}
              </p>
            )}
          </div>
          
          <div className="flex gap-1">
            {showStockButton && onReduceToZero ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                onClick={() => onReduceToZero(product.id)}
                title="Stok 0 yap"
              >
                <Copy className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(product)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
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

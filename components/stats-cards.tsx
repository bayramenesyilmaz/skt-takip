"use client"

import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import type { Product } from '@/lib/types'
import { getExpiryInfo } from '@/hooks/use-product-store'

interface StatsCardsProps {
  products: Product[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const stats = {
    expired: products.filter(p => getExpiryInfo(p.expiryDate).status === 'expired').length,
    critical: products.filter(p => getExpiryInfo(p.expiryDate).status === 'critical').length,
    warning: products.filter(p => getExpiryInfo(p.expiryDate).status === 'warning').length,
    safe: products.filter(p => getExpiryInfo(p.expiryDate).status === 'safe').length,
  }

  const cards = [
    {
      label: 'Süresi Geçmiş',
      value: stats.expired,
      icon: AlertTriangle,
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      iconBg: 'bg-destructive/20',
    },
    {
      label: 'Kritik (7 gün)',
      value: stats.critical,
      icon: AlertCircle,
      bg: 'bg-destructive/5',
      text: 'text-destructive',
      iconBg: 'bg-destructive/10',
    },
    {
      label: 'Yaklaşan (30 gün)',
      value: stats.warning,
      icon: Clock,
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-500',
      iconBg: 'bg-amber-500/20',
    },
    {
      label: 'Güvenli',
      value: stats.safe,
      icon: CheckCircle,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-500',
      iconBg: 'bg-emerald-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`${card.bg} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`${card.iconBg} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.text}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Clock, AlertCircle, CheckCircle, ShoppingCart, Package } from 'lucide-react'
import type { Product } from '@/lib/types'
import { getExpiryInfo } from '@/hooks/use-product-store'

interface StatsCardsProps {
  products: Product[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const stats = {
    expired: products.filter(p => getExpiryInfo(p.expiryDate).status === 'expired').length,
    critical: products.filter(p => getExpiryInfo(p.expiryDate).status === 'critical').length,
    remove: products.filter(p => getExpiryInfo(p.expiryDate).status === 'remove').length,
    campaign: products.filter(p => getExpiryInfo(p.expiryDate).status === 'campaign').length,
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
      description: 'Hemen kaldır!',
    },
    {
      label: 'Kritik (0-3 gün)',
      value: stats.critical,
      icon: AlertCircle,
      bg: 'bg-destructive/5',
      text: 'text-destructive',
      iconBg: 'bg-destructive/10',
      description: 'Acil raftan kaldır',
    },
    {
      label: 'Raftan Kaldır (4-14 gün)',
      value: stats.remove,
      icon: Package,
      bg: 'bg-orange-500/10',
      text: 'text-orange-600 dark:text-orange-500',
      iconBg: 'bg-orange-500/20',
      description: 'Kaldırılabilir',
    },
    {
      label: 'Kampanya (15-90 gün)',
      value: stats.campaign,
      icon: ShoppingCart,
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-500',
      iconBg: 'bg-amber-500/20',
      description: 'Yetkiliye bildir',
    },
    {
      label: 'Güvenli (90+ gün)',
      value: stats.safe,
      icon: CheckCircle,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-500',
      iconBg: 'bg-emerald-500/20',
      description: 'Güvenli',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className={`${card.bg} border-0`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className={`${card.iconBg} p-2 rounded-lg shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.text}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

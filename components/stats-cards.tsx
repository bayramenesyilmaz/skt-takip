"use client"

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, CheckCircle, ShoppingCart, Package } from 'lucide-react'
import type { ProductWithStock } from '@/lib/types'
import { getExpiryInfo } from '@/lib/expiry'

interface StatsCardsProps {
  products: ProductWithStock[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const stats = { expired: 0, critical: 0, remove: 0, campaign: 0, safe: 0 }
  for (const p of products) {
    for (const s of p.stock_items || []) {
      if (s.quantity <= 0) continue
      const info = getExpiryInfo(s.expiry_date)
      stats[info.status]++
    }
  }

  const cards = [
    { label: 'Suresi Gecmis', value: stats.expired, filter: 'expired', icon: AlertTriangle, bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/20' },
    { label: 'Kritik (0-3 gun)', value: stats.critical, filter: 'critical', icon: AlertCircle, bg: 'bg-red-500/5', text: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/10' },
    { label: 'Kaldir (4-14 gun)', value: stats.remove, filter: 'remove', icon: Package, bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-500/20' },
    { label: 'Kampanya (15-90 gun)', value: stats.campaign, filter: 'campaign', icon: ShoppingCart, bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/20' },
    { label: 'Guvenli (90+ gun)', value: stats.safe, filter: 'safe', icon: CheckCircle, bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/20' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Link key={card.label} href={`/app/liste?filter=${card.filter}`}>
          <Card className={`${card.bg} border-0 hover:shadow-md transition-shadow cursor-pointer`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`${card.iconBg} p-2 rounded-lg shrink-0`}><card.icon className={`w-4 h-4 ${card.text}`} /></div>
                <div className="min-w-0"><p className={`text-xl font-bold ${card.text}`}>{card.value}</p><p className="text-[10px] text-muted-foreground truncate">{card.label}</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

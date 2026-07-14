import type { ExpiryInfo, ExpiryStatus } from '@/lib/types'

export function getExpiryInfo(expiryDate: string): ExpiryInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: ExpiryStatus
  let label: string
  let actionRequired: string

  if (daysLeft < 0) {
    status = 'expired'
    label = `${Math.abs(daysLeft)} gün geçmiş`
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Bugün son gün!'
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft <= 3) {
    status = 'critical'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'ACİL: Raftan kaldır!'
  } else if (daysLeft <= 14) {
    status = 'remove'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Raftan kaldırmalın'
  } else if (daysLeft <= 90) {
    status = 'campaign'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Yetkiliye bildir - Kampanya önerisi'
  } else {
    status = 'safe'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Güvenli'
  }

  return { status, daysLeft, label, actionRequired }
}

export const statusConfig: Record<
  ExpiryStatus,
  { bg: string; text: string; border: string; badge: string; label: string }
> = {
  expired: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
    badge: 'bg-red-500 text-white',
    label: 'Süresi Geçmiş',
  },
  critical: {
    bg: 'bg-red-500/5',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
    badge: 'bg-red-500/90 text-white',
    label: 'Kritik (0-3 gün)',
  },
  remove: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500 text-white',
    label: 'Raftan Kaldır (4-14 gün)',
  },
  campaign: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-white',
    label: 'Kampanya (15-90 gün)',
  },
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white',
    label: 'Güvenli (90+ gün)',
  },
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

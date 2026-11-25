import type { StockItem } from '@/lib/types'

export interface FefoDeduction {
  stockId: string
  newQuantity: number
}

/**
 * Belirli bir adedi stok kayitlarindan duser; oncelik varsa (preferredExpiryDate)
 * once o SKT'den, kalan varsa en erken SKT'den (FEFO) baslayarak duser.
 * Etkilenen kayitlarin yeni adetlerini dondurur; cagiran taraf bunlari
 * updateStockItem ile uygulamali.
 */
export function computeFefoDeduction(stockItems: StockItem[], amount: number, preferredExpiryDate?: string): FefoDeduction[] {
  let remaining = amount
  const active = stockItems.filter((s) => s.quantity > 0)
  const preferred = preferredExpiryDate ? active.filter((s) => s.expiry_date === preferredExpiryDate) : []
  const rest = active.filter((s) => !preferred.includes(s))
  const sortedRest = [...rest].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  const ordered = [...preferred, ...sortedRest]

  const updates: FefoDeduction[] = []
  for (const s of ordered) {
    if (remaining <= 0) break
    const take = Math.min(s.quantity, remaining)
    if (take > 0) {
      updates.push({ stockId: s.id, newQuantity: s.quantity - take })
      remaining -= take
    }
  }
  return updates
}

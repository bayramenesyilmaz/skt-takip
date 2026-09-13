import { formatDate } from '@/lib/expiry'
import type { ProductWithStock, ReturnRecordWithProduct } from '@/lib/types'

export function buildShareMessage(
  items: { product: ProductWithStock; date?: string }[],
  quantities: Record<string, string>
): string {
  const lines = items.map(({ product: p, date }) => {
    const qty = (quantities[p.id] || '').trim()
    let line = `- ${p.name}`
    if (p.stock_code) line += ` | Stok Kodu: ${p.stock_code}`
    if (p.barcode) line += ` | Barkod: ${p.barcode}`
    if (date) line += ` (SKT: ${formatDate(date)})`
    if (qty) line += ` - ${qty} adet`
    return line
  })
  return `Kampanya Onerisi:\n${lines.join('\n')}`
}

export function buildReturnShareMessage(records: ReturnRecordWithProduct[]): string {
  const lines = records.map((r) => {
    let line = `- ${r.product?.name || 'Silinmis urun'}`
    if (r.product?.brand?.name) line += ` (${r.product.brand.name})`
    line += ` - ${r.quantity} adet`
    if (r.note) line += ` | ${r.note}`
    return line
  })
  return `Iade Bildirimi:\n${lines.join('\n')}`
}

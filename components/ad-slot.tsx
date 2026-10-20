import { ADS_ENABLED } from '@/lib/seo'

interface AdSlotProps {
  id: string
  className?: string
}

// Reklam altyapisi hazir ama pasif: alan adi ve reklam hesabi baglanana kadar
// NEXT_PUBLIC_ADS_ENABLED=true ayarlanmadigi surece hicbir sey render edilmez.
// Hesap acildiginda bu bilesenin icine ilgili reklam saglayicisinin kodu eklenir.
export function AdSlot({ id, className }: AdSlotProps) {
  if (!ADS_ENABLED) return null

  return (
    <div
      data-ad-slot={id}
      className={`flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground min-h-16 ${className || ''}`}
    >
      Reklam Alani
    </div>
  )
}

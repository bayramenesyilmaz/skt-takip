import { Megaphone } from 'lucide-react'
import { ADS_ENABLED } from '@/lib/seo'

interface AdSlotProps {
  id: string
  className?: string
}

// Reklam alani: gercek bir reklam hesabi baglanana kadar yer tutucu bir
// banner gosterir. Tamamen kaldirmak icin NEXT_PUBLIC_ADS_ENABLED=false
// ayarlanabilir. Hesap acildiginda bu bilesenin icine ilgili reklam
// saglayicisinin kodu eklenir.
export function AdSlot({ id, className }: AdSlotProps) {
  if (!ADS_ENABLED) return null

  return (
    <div
      data-ad-slot={id}
      className={`relative flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-gradient-to-r from-muted/40 to-muted/20 text-xs text-muted-foreground min-h-16 overflow-hidden ${className || ''}`}
    >
      <span className="absolute top-1 right-1.5 text-[9px] font-medium tracking-wide text-muted-foreground/70">REKLAM</span>
      <Megaphone className="w-4 h-4 opacity-50 shrink-0" />
      <span className="truncate">Reklam Alani</span>
    </div>
  )
}

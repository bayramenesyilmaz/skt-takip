"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListOrdered, Plus, FileText, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: typeof Home
  label: string
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Ana' },
  { href: '/liste', icon: ListOrdered, label: 'Liste' },
  { href: '/rapor', icon: FileText, label: 'Rapor' },
  { href: '/lokasyonlar', icon: MapPin, label: 'Lokasyon' },
]

interface BottomNavProps {
  onAddClick?: () => void
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around py-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Add Button */}
          <Link href="/ekle" className="flex flex-col items-center gap-0.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-all">
            <Plus className="w-5 h-5" />
            <span className="text-[9px] font-medium">Ekle</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

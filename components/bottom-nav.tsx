"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListOrdered, Plus, Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: typeof Home
  label: string
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Ana Sayfa' },
  { href: '/liste', icon: ListOrdered, label: 'Liste' },
  { href: '/ara', icon: Search, label: 'Ara' },
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
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[56px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          
          {/* Center Add Button */}
          <button
            onClick={onAddClick}
            className="flex flex-col items-center gap-0.5 -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-95">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Ekle</span>
          </button>

          {navItems.slice(2).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all min-w-[56px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

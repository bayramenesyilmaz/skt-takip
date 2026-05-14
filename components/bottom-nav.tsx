"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ListOrdered, FileText, Settings, AlertCircle } from 'lucide-react'
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
  { href: '/eksik', icon: AlertCircle, label: 'Eksik' },
  { href: '/ayarlar', icon: Settings, label: 'Ayarlar' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
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
    </nav>
  )
}

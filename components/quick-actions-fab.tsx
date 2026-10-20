"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Layers, Undo2, ScanBarcode, PackageX, ShoppingCart, Zap, X } from 'lucide-react'

const quickLinks = [
  { href: '/app/kampanya', label: 'Kampanya Urunleri', icon: ShoppingCart },
  { href: '/app/stok-sifir', label: 'Stok Sifir Urunler', icon: PackageX },
  { href: '/app/barkodsuz', label: 'Barkodsuz Urunler', icon: ScanBarcode },
  { href: '/app/iade', label: 'Iade Kayitlari', icon: Undo2 },
  { href: '/app/paletler', label: 'Paletler', icon: Layers },
]

export function QuickActionsFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2">
        {open && quickLinks.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-card border border-border shadow-lg text-sm font-medium text-foreground animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}
          >
            <item.icon className="w-4 h-4 text-primary shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-12 h-12 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground transition-transform active:scale-95"
          aria-label="Hizli islemler"
        >
          {open ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
        </button>
      </div>
    </>
  )
}

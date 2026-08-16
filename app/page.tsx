'use client'

import Link from 'next/link'
import { Package, Barcode, Search, WifiOff, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  { icon: Barcode, title: 'Barkod ile Hizli Islem', description: 'Kamerayla barkod okutarak urun ekle, guncelle ve bul.' },
  { icon: Search, title: 'Hizli Urun Bulma', description: 'Isim, stok kodu veya barkodla aninda ara.' },
  { icon: Package, title: 'SKT Takibi', description: 'Son kullanma tarihine gore otomatik kritik/kampanya uyarilari.' },
  { icon: WifiOff, title: 'Tamamen Cevrimdisi', description: 'Veritabani veya internet gerekmez, tum veriler cihazinizda saklanir.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Package className="w-4 h-4" /> SKT Takip Sistemi
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Son Kullanma Tarihi<br /><span className="text-primary">Barkodla Hizli Takip</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Reyon gorevlileri icin barkod tarayarak urun ekleyip guncelleyebileceginiz, tamamen cihazinizda calisan
          son kullanma tarihi takip uygulamasi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/app"><Button size="lg" className="w-full sm:w-auto">Uygulamayi Ac<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-6 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Kayit gerektirmez, reklam yoktur. Tum verileriniz sadece bu cihazda saklanir; internet baglantisi olmadan da calisir.
            </p>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border mt-4">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">SKT Takip &copy; 2026 - Market reyon gorevlileri icin profesyonel takip sistemi</p>
        </div>
      </footer>
    </main>
  )
}

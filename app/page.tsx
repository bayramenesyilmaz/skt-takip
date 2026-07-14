'use client'

import Link from 'next/link'
import { Package, Shield, Zap, BarChart3, Smartphone, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Çok Şubeli Yönetim',
    description: 'Ana yönetici şubeleri ve müdürleri yönetir, tüm şube bilgilerine erişir.',
  },
  {
    icon: Zap,
    title: 'Dinamik Toplu Ekleme',
    description: 'Excel\'den toplu ürün ekleme, kolon eşleştirme şablonları ile esnek yapı.',
  },
  {
    icon: BarChart3,
    title: 'Kampanya & İmha Takibi',
    description: 'Raf ömrüne göre otomatik kampanya, kaldırma ve imha uyarıları.',
  },
  {
    icon: Smartphone,
    title: 'Offline PWA',
    description: 'İnternet olmadan da çalışır, tüm veriler cihazınızda güvende.',
  },
]

const plans = [
  {
    name: 'Çok Şubeli',
    tag: 'Premium',
    description: 'Zincir marketler ve çoklu şube operasyonları',
    features: [
      'Sınırsız şube',
      'Şube müdürü atama',
      'Tüm şubeleri görüntüleme',
      'Excel import/export',
      'Dinamik kolon eşleştirme',
    ],
    type: 'multi_branch',
  },
  {
    name: 'Tek Şubeli',
    tag: 'Premium',
    description: 'Tek mağaza veya küçük işletmeler için',
    features: [
      'Personel yönetimi',
      'Lokasyon & reyon yönetimi',
      'Kampanya takibi',
      'Excel import/export',
      'Barkod tarama',
    ],
    type: 'single_branch',
  },
  {
    name: 'Yerel Mod',
    tag: 'Ücretsiz',
    description: 'Veritabanı gerektirmeden, cihazınızda saklanır',
    features: [
      'Veriler cihazda saklanır',
      'Kayıt gerektirmez',
      'Temel SKT takibi',
      'Reklam destekli',
    ],
    type: 'local',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Package className="w-4 h-4" />
          SKT Takip Sistemi
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Son Kullanma Tarihi
          <br />
          <span className="text-primary">Profesyonel Takip</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Market ve zincir mağazalar için geliştirilmiş, çok şubeli destekli,
          kampanya ve imha yönetimi içeren stok takip sistemi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Hemen Başla
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/local">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto">
              Kayıtsız Kullan
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
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

      {/* Plans */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Size Uygun Planı Seçin
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.name} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      plan.tag === 'Premium'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {plan.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?type=${plan.type}`}>
                  <Button
                    className="w-full"
                    variant={plan.tag === 'Premium' ? 'default' : 'outline'}
                  >
                    {plan.name} ile Başla
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            SKT Takip &copy; 2026 - Market reyon görevlileri için profesyonel takip sistemi
          </p>
        </div>
      </footer>
    </main>
  )
}

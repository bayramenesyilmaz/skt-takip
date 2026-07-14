'use client'

import { useRouter } from 'next/navigation'
import { setStorageMode, resetRepositoryCache } from '@/lib/repositories/repository.factory'
import { LocalRepository } from '@/lib/repositories/local-repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smartphone, Package, WifiOff, Check, ArrowRight } from 'lucide-react'

export default function LocalModePage() {
  const router = useRouter()

  const handleStart = async () => {
    setStorageMode('local')
    resetRepositoryCache()
    const repo = new LocalRepository()
    const existing = await repo.getOrganization('local')
    if (!existing) await repo.createOrganization({ name: 'Yerel Kullanici', type: 'local' })
    router.push('/app')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Smartphone className="w-5 h-5 text-emerald-600" /></div>
              <CardTitle className="text-xl">Yerel Mod</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"><WifiOff className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-foreground">Cevrimdisi Calisir</p><p className="text-xs text-muted-foreground">Internet baglantisi gerekmez, tum veriler cihazinizda saklanir.</p></div></div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"><Package className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-foreground">Temel SKT Takibi</p><p className="text-xs text-muted-foreground">Urun ekleyin, son kullanma tarihlerini takip edin, lokasyon yonetin.</p></div></div>
              <div className="flex items-start gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20"><Check className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-foreground">Reklam Destekli</p><p className="text-xs text-muted-foreground">Bu mod reklamlarla desteklenir ve tamamen ucretsizdir.</p></div></div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium text-foreground mb-1">Dikkat:</p>
              Yerel modda verileriniz sadece bu cihazda saklanir. Cihaz degistirirseniz veya tarayici verilerini silerseniz verileriniz kaybolabilir.
            </div>
            <Button onClick={handleStart} className="w-full h-11">Yerel Modda Basla<ArrowRight className="w-4 h-4 ml-2" /></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

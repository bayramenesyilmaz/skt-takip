'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import {
  getStorageMode,
  setStorageMode,
  resetRepositoryCache,
} from '@/lib/repositories/repository.factory'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Building2, MapPin, Tag, Users, Trash2, LogOut,
  Database, Info, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const router = useRouter()
  const { profile, organization, signOut } = useAuth()
  const { products, locations, brands } = useAppData()
  const [mounted, setMounted] = useState(false)
  const [storageMode, setStorageModeState] = useState<'supabase' | 'local'>('supabase')

  useEffect(() => {
    setStorageModeState(getStorageMode())
    setMounted(true)
  }, [])

  const handleStorageChange = (mode: 'local' | 'supabase') => {
    setStorageMode(mode)
    setStorageModeState(mode)
    resetRepositoryCache()
    router.refresh()
  }

  const handleSignOut = async () => {
    if (storageMode === 'local') {
      setStorageMode('supabase')
      resetRepositoryCache()
      router.push('/')
    } else {
      await signOut()
      router.push('/')
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Ayarlar</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4" />
            <h2 className="font-semibold">Organizasyon</h2>
          </div>
          <p className="text-sm">{organization?.name || 'Organizasyon'}</p>
          <Badge variant="outline">{profile?.role}</Badge>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Veri Ozeti</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-gray-500">Urun</p></div>
            <div><p className="text-2xl font-bold">{locations.length}</p><p className="text-xs text-gray-500">Lokasyon</p></div>
            <div><p className="text-2xl font-bold">{brands.length}</p><p className="text-xs text-gray-500">Marka</p></div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Yonetim</h2>
          <div className="space-y-2">
            <Link href="/app/lokasyonlar" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <MapPin className="w-4 h-4" /> Lokasyonlar
            </Link>
            <Link href="/app/markalar" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <Tag className="w-4 h-4" /> Markalar
            </Link>
            <Link href="/app/personel" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <Users className="w-4 h-4" /> Personel
            </Link>
            <Link href="/app/subeler" className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <Building2 className="w-4 h-4" /> Subeler
            </Link>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4" />
            <h2 className="font-semibold">Veri Modu</h2>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {storageMode === 'local' ? 'Veriler cihazinizda saklaniyor' : 'Veriler bulutta saklaniyor'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant={storageMode === 'local' ? 'default' : 'outline'} onClick={() => handleStorageChange('local')}>Local</Button>
            <Button size="sm" variant={storageMode === 'supabase' ? 'default' : 'outline'} onClick={() => handleStorageChange('supabase')}>Remote</Button>
            <Button size="sm" variant="ghost" onClick={() => { resetRepositoryCache(); router.refresh() }}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </Card>

        <Card className="p-4 border-red-200">
          <h2 className="font-semibold mb-2 text-red-600">Hesap</h2>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-1" /> Cikis Yap
          </Button>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4" />
            <h2 className="font-semibold text-sm">Uygulama Bilgisi</h2>
          </div>
          <p className="text-xs text-gray-500">Versiyon 3.0.0 - PWA destekli</p>
        </Card>
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

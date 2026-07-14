"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode, setStorageMode, resetRepositoryCache } from '@/lib/repositories/repository.factory'
import { useRouter } from 'next/navigation'
import {
  Settings, Trash2, Database, Smartphone, Info, MapPin, Package, Tag, Users, LogOut, Building2, GitBranch
} from 'lucide-react'

export default function AyarlarPage() {
  const router = useRouter()
  const { profile, organization, signOut } = useAuth()
  const storageMode = getStorageMode()
  const { products, locations, brands, clearAllProducts } = useAppData() as any

  const handleClearAll = () => {
    if (confirm(`${products.length} ürün silinecek! Emin misiniz?`)) {
      clearAllProducts?.()
    }
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

  const canManageStaff = profile?.role === 'super_admin' || profile?.role === 'owner'

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Ayarlar</h1>
              <p className="text-xs text-muted-foreground">Veri yönetimi</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Organization Info */}
        {organization && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Firma Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Firma Adı</span>
                <span className="text-sm font-medium">{organization.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Tip</span>
                <Badge variant="secondary">
                  {organization.type === 'multi_branch' ? 'Çok Şubeli' : 'Tek Şubeli'}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Rolünüz</span>
                <Badge variant="outline">
                  {profile?.role === 'super_admin' ? 'Süper Admin' :
                   profile?.role === 'owner' ? 'Firma Sahibi' :
                   profile?.role === 'branch_manager' ? 'Şube Müdürü' : 'Personel'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Veri Özeti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Toplam Ürün</span>
              </div>
              <Badge variant="secondary" className="text-base px-3">{products.length}</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Lokasyonlar</span>
              </div>
              <Badge variant="secondary" className="text-base px-3">{locations.length}</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Markalar</span>
              </div>
              <Badge variant="secondary" className="text-base px-3">{brands.length}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href="/app/lokasyonlar">
                <Button variant="outline" className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Lokasyonlar
                </Button>
              </Link>
              <Link href="/app/markalar">
                <Button variant="outline" className="w-full">
                  <Tag className="w-4 h-4 mr-2" />
                  Markalar
                </Button>
              </Link>
            </div>

            {canManageStaff && storageMode !== 'local' && (
              <Link href="/app/personel">
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Personel Yönetimi
                </Button>
              </Link>
            )}

            {organization?.type === 'multi_branch' && canManageStaff && (
              <Link href="/app/subeler">
                <Button variant="outline" className="w-full">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Şube Yönetimi
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Tehlikeli Bölge
            </CardTitle>
            <CardDescription className="text-sm">Bu işlemler geri alınamaz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClearAll}
              disabled={products.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tüm Ürünleri Sil ({products.length})
            </Button>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Uygulama Bilgisi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Versiyon</span>
              </div>
              <Badge variant="outline">3.0.0</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
              <p>Bu uygulama PWA formatındadır ve offline çalışır.</p>
              <p>{storageMode === 'local'
                ? 'Verileriniz bu cihazda yerel olarak saklanır.'
                : 'Verileriniz bulutta güvenle saklanır.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </main>
  )
}

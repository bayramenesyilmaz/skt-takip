"use client"
import { useProductStore } from "@/hooks/use-product-store"
import { BottomNav } from "@/components/bottom-nav"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Settings, Plus, X, Database, Download, Upload, Trash2, Check } from 'lucide-react'

export default function AyarlarPage() {
  const store = useProductStore() || {}
  const { 
    settings = { allBrands: [], noReturnBrands: [] }, 
    updateSettings = () => {}, 
    products = [], 
    getBrands = () => [], 
    addBrand = () => {}, 
    deleteBrand = () => {}, 
    toggleBrandReturn = () => {}, 
    clearAllData = () => {}, 
    exportData = () => '', 
    importData = () => false, 
    isLoading = false 
  } = store
  
  const [newBrand, setNewBrand] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [pwaDisabled, setPwaDisabled] = useState(false)
  const allBrands = getBrands()

  // PWA prompt state'i localStorage'dan al
  useEffect(() => {
    const disabled = localStorage.getItem('pwa-prompt-disabled') === 'true'
    setPwaDisabled(disabled)
  }, [])

  const handleAddBrand = () => {
    if (!newBrand.trim()) return
    addBrand(newBrand.trim())
    setNewBrand('')
  }

  const handleRemoveBrand = (brand: string) => {
    deleteBrand(brand)
  }

  const handleToggleReturn = (brand: string) => {
    toggleBrandReturn(brand)
  }

  const isNoReturnBrand = (brand: string) => {
    return settings.noReturnBrands.includes(brand)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `skt-takip-yedek-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        importData(jsonData)
      } catch {
        setImportError('Gecersiz dosya formati')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = () => {
    clearAllData()
    setShowClearConfirm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Ayarlar</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Markalar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Urun Markalari</CardTitle>
            <CardDescription className="text-xs">
              Ticari markalari ekleyip iade durumlarini belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Yeni marka adi..."
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBrand()}
                className="h-9"
              />
              <Button onClick={handleAddBrand} size="sm" className="h-9">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {allBrands.length > 0 ? (
              <div className="space-y-2">
                {allBrands.map(brand => (
                  <div key={brand} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{brand}</p>
                      <p className="text-xs text-muted-foreground">
                        {isNoReturnBrand(brand) ? 'İade almıyor' : 'İade alıyor'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={isNoReturnBrand(brand) ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleToggleReturn(brand)}
                        title={isNoReturnBrand(brand) ? 'İade Almıyor' : 'İade Alıyor'}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveBrand(brand)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Henuz marka eklenmedi</p>
            )}
          </CardContent>
        </Card>

        {/* PWA Ayarlari */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uygulama Ayarlari</CardTitle>
            <CardDescription className="text-xs">
              Uygulama davranisini ozelleştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Indir Bildirimi</p>
                <p className="text-xs text-muted-foreground">
                  PWA indir promptu gosterme
                </p>
              </div>
              <Switch
                checked={pwaDisabled}
                onCheckedChange={(checked) => {
                  setPwaDisabled(checked)
                  localStorage.setItem('pwa-prompt-disabled', checked ? 'true' : 'false')
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Veri Yonetimi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Veri Yonetimi
            </CardTitle>
            <CardDescription className="text-xs">
              Verilerinizi yedekleyin veya iceri aktarin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Toplam Urun</p>
                <p className="text-xs text-muted-foreground">{products.length} urun kayitli</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleExport} className="h-10">
                <Download className="w-4 h-4 mr-2" />
                Yedekle
              </Button>
              
              <Button variant="outline" className="h-10 relative" asChild>
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  Yukle
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </Button>
            </div>

            {importError && (
              <p className="text-xs text-red-500">{importError}</p>
            )}
          </CardContent>
        </Card>

        {/* Tehlikeli Islemler */}
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Tehlikeli Bolge
            </CardTitle>
            <CardDescription className="text-xs">
              Bu islemler geri alinamaz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => setShowClearConfirm(true)}
              className="w-full"
            >
              Tum Verileri Sil
            </Button>
          </CardContent>
        </Card>

        {/* Bilgi */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground text-center">
              SKT Takip v1.0<br />
              Son kullanma tarihi yonetim uygulamasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-red-600">Tum Verileri Sil?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tum urunler ve ayarlar silinecek. Bu islem geri alinamaz!
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="flex-1">
                  Iptal
                </Button>
                <Button variant="destructive" onClick={handleClearAll} className="flex-1">
                  Tumu Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav />
    </main>
  )
}

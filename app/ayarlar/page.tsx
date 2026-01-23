"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
import { useProductStore } from '@/hooks/use-product-store'
import { 
  Settings, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  Database,
  Smartphone,
  Info,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import type { Product } from '@/lib/types'

export default function AyarlarPage() {
  const { products, addProduct, clearAll } = useProductStore()
  const [showForm, setShowForm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert('Tarayiciniz bildirimleri desteklemiyor.')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(prev => !prev)
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    } else {
      alert('Bildirim izni reddedildi. Tarayici ayarlarindan izin vermeniz gerekiyor.')
    }
  }

  const handleExport = () => {
    const data = JSON.stringify(products, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skt-takip-yedek-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text) as Product[]
        
        if (Array.isArray(data)) {
          let imported = 0
          for (const product of data) {
            if (product.name && product.stockCode && product.expiryDate) {
              addProduct({
                name: product.name,
                stockCode: product.stockCode,
                barcode: product.barcode || '',
                expiryDate: product.expiryDate,
              })
              imported++
            }
          }
          alert(`${imported} urun basariyla iceri aktarildi!`)
        }
      } catch {
        alert('Dosya okunamadi. Gecerli bir JSON dosyasi secin.')
      }
    }
    input.click()
  }

  // Parse date from various formats (DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD)
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null
    
    // Clean the string
    const cleaned = dateStr.trim()
    
    // Try DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY format
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/)
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    
    // Try YYYY-MM-DD format
    const ymdMatch = cleaned.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/)
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch
      const date = new Date(Number(year), Number(month) - 1, Number(day))
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    
    return null
  }

  const handleCSVImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        
        let success = 0
        let failed = 0
        
        // Skip header row if it looks like a header
        const startIndex = lines[0]?.toLowerCase().includes('urun') || 
                          lines[0]?.toLowerCase().includes('ad') ||
                          lines[0]?.toLowerCase().includes('stok') ||
                          lines[0]?.toLowerCase().includes('tarih') ? 1 : 0
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          // Split by comma, semicolon, or tab
          const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''))
          
          if (parts.length >= 2) {
            // Expected format: Urun Adi, SKT (optional: Stok Kodu, Barkod)
            const name = parts[0]
            let expiryDate: string | null = null
            let stockCode = ''
            let barcode = ''
            
            // Try to find date in parts
            for (let j = 1; j < parts.length; j++) {
              const parsed = parseDate(parts[j])
              if (parsed) {
                expiryDate = parsed
                break
              }
            }
            
            // If we have more parts, try to identify them
            if (parts.length >= 3) {
              // Check if second part is stock code (6 digits)
              if (/^\d{6}$/.test(parts[1])) {
                stockCode = parts[1]
              }
            }
            
            if (parts.length >= 4) {
              // Check for barcode (long number)
              if (/^\d{8,14}$/.test(parts[2]) || /^\d{8,14}$/.test(parts[3])) {
                barcode = parts.find(p => /^\d{8,14}$/.test(p)) || ''
              }
            }
            
            // Generate stock code if not found
            if (!stockCode) {
              stockCode = String(100000 + success + products.length).slice(-6)
            }
            
            if (name && expiryDate) {
              addProduct({
                name,
                stockCode,
                barcode,
                expiryDate,
              })
              success++
            } else {
              failed++
            }
          } else {
            failed++
          }
        }
        
        setImportResult({ success, failed })
        setTimeout(() => setImportResult(null), 5000)
      } catch {
        alert('Dosya okunamadi. Gecerli bir CSV dosyasi secin.')
      }
    }
    input.click()
  }

  const handleClearAll = () => {
    clearAll()
    setShowClearConfirm(false)
  }

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product)
    setShowForm(false)
  }

  if (showForm) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={handleAddProduct}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ayarlar</h1>
              <p className="text-xs text-muted-foreground">
                Uygulama ayarlari ve veri yonetimi
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Bildirimler
            </CardTitle>
            <CardDescription className="text-sm">
              SKT uyarilari icin bildirim al
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm">
                Bildirimleri Etkinlestir
              </Label>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* CSV Import - Main Feature */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Excel/CSV ile Toplu Yukleme
            </CardTitle>
            <CardDescription className="text-sm">
              Google Sheets veya Excel dosyanizi CSV olarak indirip yukleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-card rounded-lg p-3 text-xs text-muted-foreground space-y-2 border">
              <p className="font-medium text-foreground">Dosya Formati:</p>
              <p>Her satira bir urun yazin. Sutunlar virgul, noktali virgul veya tab ile ayrilmali:</p>
              <code className="block bg-muted p-2 rounded text-[11px] font-mono">
                Urun Adi, SKT (GG/AA/YYYY), Stok Kodu, Barkod
              </code>
              <p className="text-[11px]">Ornek: Lezita Doner Pilic, 18/07/2026, 123456, 8690000000000</p>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleCSVImport}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV Dosyasi Sec ve Yukle
            </Button>
            
            {importResult && (
              <div className={`rounded-lg p-3 flex items-start gap-2 ${
                importResult.failed === 0 
                  ? 'bg-emerald-500/10 text-emerald-700' 
                  : 'bg-amber-500/10 text-amber-700'
              }`}>
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{importResult.success} urun basariyla eklendi!</p>
                  {importResult.failed > 0 && (
                    <p className="text-xs opacity-80">{importResult.failed} satir okunamadi (hatali format)</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Veri Yonetimi
            </CardTitle>
            <CardDescription className="text-sm">
              Verilerinizi yedekleyin veya iceri aktarin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Toplam Urun</p>
                <p className="text-xs text-muted-foreground">Kayitli urun sayisi</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {products.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleExport}
                disabled={products.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON Yedekle
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4 mr-2" />
                JSON Yukle
              </Button>
            </div>

            {!showClearConfirm ? (
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowClearConfirm(true)}
                disabled={products.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tum Verileri Sil
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-destructive text-center font-medium">
                  Emin misiniz? Bu islem geri alinamaz!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Vazgec
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleClearAll}
                  >
                    Evet, Sil
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader className="pb-3">
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
              <Badge variant="outline">1.0.0</Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Bu uygulama PWA (Progressive Web App) formatindadir. 
                Ana ekrana ekleyerek uygulama gibi kullanabilirsiniz.
              </p>
              <p>
                Verileriniz yerel olarak cihazinizda saklanir.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav onAddClick={() => setShowForm(true)} />
    </main>
  )
}

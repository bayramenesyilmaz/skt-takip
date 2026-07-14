"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getRepository } from '@/lib/repositories/repository.factory'
import { ClipboardPaste, Upload, Check, X, AlertCircle, FileSpreadsheet, Download, Settings2, ArrowLeft } from 'lucide-react'
import type { ParsedProduct } from '@/lib/types'

const AVAILABLE_FIELDS = [
  { key: 'name', label: 'Ürün Adı', required: true },
  { key: 'expiryDate', label: 'Son Kullanma Tarihi', required: true },
  { key: 'stockCode', label: 'Stok Kodu', required: false },
  { key: 'barcode', label: 'Barkod', required: false },
  { key: 'brand', label: 'Marka', required: false },
]

export default function ImportPage() {
  const { organization } = useAuth()
  const { brands, reload } = useAppData()
  const [step, setStep] = useState<'upload' | 'map' | 'review'>('upload')
  const [rawText, setRawText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const orgId = organization?.id || 'local'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\n/).filter(l => l.trim())
    if (lines.length === 0) return

    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
    const parsedHeaders = lines[0].split(delimiter).map(h => h.trim())
    const parsedRows = lines.slice(1).map(line => line.split(delimiter).map(c => c.trim()))

    setHeaders(parsedHeaders)
    setRows(parsedRows)

    const autoMapping: Record<string, string> = {}
    for (const field of AVAILABLE_FIELDS) {
      const match = parsedHeaders.find(h =>
        h.toLowerCase().includes(field.key.toLowerCase()) ||
        h.toLowerCase().includes(field.label.toLowerCase())
      )
      if (match) autoMapping[field.key] = match
    }
    setMapping(autoMapping)
    setStep('map')
  }

  const handlePaste = () => {
    if (!rawText.trim()) return
    parseCSV(rawText)
  }

  const handleMapAndPreview = () => {
    const products: ParsedProduct[] = rows.map(row => {
      const getValue = (fieldKey: string) => {
        const colName = mapping[fieldKey]
        if (!colName) return ''
        const colIndex = headers.indexOf(colName)
        if (colIndex < 0) return ''
        return row[colIndex] || ''
      }

      const name = getValue('name')
      const expiryDateRaw = getValue('expiryDate')

      let expiryDate = ''
      let isValid = true
      let error: string | undefined

      if (expiryDateRaw) {
        const dateMatch = expiryDateRaw.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/)
        if (dateMatch) {
          let [, day, month, year] = dateMatch
          if (year.length === 2) year = '20' + year
          expiryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          const dateObj = new Date(expiryDate)
          if (isNaN(dateObj.getTime())) {
            isValid = false
            error = 'Geçersiz tarih'
          }
        } else {
          const dateObj = new Date(expiryDateRaw)
          if (!isNaN(dateObj.getTime())) {
            expiryDate = dateObj.toISOString().split('T')[0]
          } else {
            isValid = false
            error = 'Geçersiz tarih'
          }
        }
      }

      if (!name) {
        isValid = false
        error = 'Ürün adı boş'
      }

      return {
        name,
        expiryDate,
        stockCode: getValue('stockCode') || undefined,
        barcode: getValue('barcode') || undefined,
        brand: getValue('brand') || undefined,
        isValid,
        error,
      }
    })

    setParsedProducts(products)
    setStep('review')
  }

  const handleImport = async () => {
    const valid = parsedProducts.filter(p => p.isValid)
    if (valid.length === 0) return

    const repo = getRepository()

    for (const p of valid) {
      let brandId: string | undefined
      if (p.brand) {
        const existingBrand = brands.find(b => b.name.toLowerCase() === p.brand!.toLowerCase())
        if (existingBrand) {
          brandId = existingBrand.id
        } else {
          const newBrand = await repo.createBrand({
            org_id: orgId,
            name: p.brand,
            return_accepts: true,
          } as any)
          brandId = newBrand.id
        }
      }

      const product = await repo.createProduct({
        org_id: orgId,
        name: p.name,
        stock_code: p.stockCode,
        barcode: p.barcode,
        brand_id: brandId,
        return_accepts: true,
      } as any)

      if (p.expiryDate) {
        await repo.createStockItem({
          org_id: orgId,
          product_id: product.id,
          expiry_date: p.expiryDate,
          quantity: 1,
        } as any)
      }
    }

    reload()
    setStep('upload')
    setRawText('')
    setParsedProducts([])
    setHeaders([])
    setRows([])
    setMapping({})
    alert(`${valid.length} ürün başarıyla içe aktarıldı!`)
  }

  const validCount = parsedProducts.filter(p => p.isValid).length
  const invalidCount = parsedProducts.filter(p => !p.isValid).length

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardPaste className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Toplu İçe Aktarma</h1>
                <p className="text-xs text-muted-foreground">Excel/CSV ile ürün ekle</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Dosya Yükle veya Yapıştır
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Excel/CSV dosyası seç</p>
                <p className="text-xs text-muted-foreground">CSV veya TXT formatında olmalı</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">veya</div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Verileri yapıştır</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ürün Adı;Stok Kodu;Barkod;Marka;SKT\nPınar Süt 1L;123456;8690001;Pınar;01/12/2026\nÜlker Çikolata;789012;8690002;Ülker;15/06/2027`}
                  className="w-full h-32 p-3 text-sm border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Sütunları noktalı virgül (;), virgül (,) veya tab ile ayırın.
                </p>
              </div>

              <Button onClick={handlePaste} disabled={!rawText.trim()} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Devam Et
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'map' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Kolon Eşleştirme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Hangi kolon hangi veriye karşılık geliyor? Otomatik eşleştirme yapıldı, kontrol edip düzeltebilirsiniz.
              </p>

              <div className="space-y-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <Label className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      className="flex-1 h-10 px-3 border rounded-md text-sm bg-background"
                    >
                      <option value="">Eşleştirme</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-1">Önizleme (ilk 3 satır):</p>
                {rows.slice(0, 3).map((row, i) => (
                  <div key={i} className="text-xs text-muted-foreground mt-1">
                    {row.join(' | ')}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleMapAndPreview} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Önizle ve Kontrol Et
                </Button>
                <Button variant="outline" onClick={() => setStep('upload')}>Geri</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                <Check className="w-3 h-3 mr-1" />
                {validCount} geçerli
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {invalidCount} hatalı
                </Badge>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedProducts.map((product, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    product.isValid
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{product.name || '(isimsiz)'}</p>
                    <p className={`text-xs ${product.isValid ? 'text-muted-foreground' : 'text-red-600'}`}>
                      {product.isValid ? `SKT: ${formatDate(product.expiryDate)}` : product.error}
                    </p>
                    {product.brand && <p className="text-xs text-muted-foreground">Marka: {product.brand}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={validCount === 0} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                {validCount} Ürünü İçe Aktar
              </Button>
              <Button variant="outline" onClick={() => setStep('map')}>Geri</Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

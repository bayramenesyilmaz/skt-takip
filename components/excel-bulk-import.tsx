"use client"

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Upload, Download, Check, X, AlertCircle, Package, Trash2 } from 'lucide-react'
import type { ParsedProduct, ProductWithStock } from '@/lib/types'

interface ExcelBulkImportProps {
  existingProducts: ProductWithStock[]
  onAdd: (products: ParsedProduct[]) => void
  onCancel: () => void
}

function normalizeHeader(h: string): string {
  return String(h || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '')
}

function findColumn(headers: string[], keywords: string[]): number {
  return headers.findIndex((h) => keywords.some((k) => h.includes(k)))
}

function parseWorkbook(buffer: ArrayBuffer): { products: ParsedProduct[]; error?: string } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { products: [], error: 'Dosyada sayfa bulunamadi.' }

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  if (rows.length < 2) return { products: [], error: 'Dosyada basliktan sonra veri satiri bulunamadi.' }

  const headers = (rows[0] as unknown[]).map((h) => normalizeHeader(String(h ?? '')))
  const nameCol = findColumn(headers, ['urun', 'ad', 'isim', 'name'])
  const stockCodeCol = findColumn(headers, ['stok', 'kod', 'code'])
  const brandCol = findColumn(headers, ['marka', 'brand'])
  const barcodeCol = findColumn(headers, ['barkod', 'barcode'])

  if (nameCol === -1) {
    return { products: [], error: 'Urun adi sutunu bulunamadi. Basliklarda "Urun Adi" gibi bir sutun olmali.' }
  }

  const products: ParsedProduct[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || row.length === 0) continue
    const cell = (idx: number) => (idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '')
    const name = cell(nameCol)
    if (!name) continue
    products.push({
      name,
      stockCode: cell(stockCodeCol) || undefined,
      brand: cell(brandCol) || undefined,
      barcode: cell(barcodeCol) || undefined,
      isValid: true,
    })
  }
  return { products }
}

function markDuplicates(products: ParsedProduct[], existingProducts: ProductWithStock[]): ParsedProduct[] {
  const existingStockCodes = new Set(
    existingProducts.map((p) => p.stock_code?.toLowerCase().trim()).filter((v): v is string => !!v)
  )
  const existingNames = new Set(existingProducts.map((p) => p.name.toLowerCase().trim()))
  const seenStockCodes = new Set<string>()
  const seenNames = new Set<string>()

  return products.map((p) => {
    const code = p.stockCode?.toLowerCase().trim()
    const name = p.name.toLowerCase().trim()
    const isExistingDuplicate = (code && existingStockCodes.has(code)) || (!code && existingNames.has(name))
    const isBatchDuplicate = (code && seenStockCodes.has(code)) || (!code && seenNames.has(name))
    if (code) seenStockCodes.add(code)
    seenNames.add(name)

    if (isExistingDuplicate || isBatchDuplicate) {
      return { ...p, isValid: false, error: isExistingDuplicate ? 'Zaten kayitli (atlanacak)' : 'Listede tekrar ediyor (atlanacak)' }
    }
    return p
  })
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ['Urun Adi', 'Stok Kodu', 'Marka', 'Barkod (opsiyonel)'],
    ['Ornek Urun 1kg', '123456', 'Ornek Marka', ''],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Urunler')
  XLSX.writeFile(wb, 'skt-takip-urun-sablonu.xlsx')
}

export function ExcelBulkImport({ existingProducts, onAdd, onCancel }: ExcelBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [isParsed, setIsParsed] = useState(false)
  const [parseError, setParseError] = useState('')

  const handleFile = async (file: File) => {
    setParseError('')
    setFileName(file.name)
    try {
      const buffer = await file.arrayBuffer()
      const { products, error } = parseWorkbook(buffer)
      if (error) {
        setParseError(error)
        return
      }
      setParsedProducts(markDuplicates(products, existingProducts))
      setIsParsed(true)
    } catch {
      setParseError('Dosya okunamadi. Lutfen gecerli bir .xlsx veya .csv dosyasi secin.')
    }
  }

  const handleRemoveProduct = (index: number) => {
    setParsedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const validProducts = parsedProducts.filter((p) => p.isValid)
    if (validProducts.length > 0) onAdd(validProducts)
  }

  const validCount = parsedProducts.filter((p) => p.isValid).length
  const skippedCount = parsedProducts.filter((p) => !p.isValid).length

  return (
    <Card className="border-primary/20 py-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Excel ile Toplu Ekle</CardTitle>
        <p className="text-sm text-muted-foreground">Barkodu olmayan urunleri (urun adi, stok kodu, marka) Excel dosyasindan toplu ekleyin.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isParsed ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />Ornek Sablon Indir
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-center hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{fileName || 'Excel dosyasi sec (.xlsx, .xls, .csv)'}</p>
              <p className="text-xs text-muted-foreground">Ilk satir basliklari icermeli: Urun Adi, Stok Kodu, Marka</p>
            </button>

            {parseError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{parseError}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1"><X className="w-4 h-4 mr-2" />Iptal</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600"><Check className="w-3 h-3 mr-1" />{validCount} eklenecek urun</Badge>
              {skippedCount > 0 && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />{skippedCount} atlanacak</Badge>}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedProducts.map((product, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${product.isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Package className={`w-4 h-4 shrink-0 ${product.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className={`text-xs ${product.isValid ? 'text-muted-foreground' : 'text-amber-600'}`}>
                        {product.isValid
                          ? [product.stockCode && `Stok: ${product.stockCode}`, product.brand].filter(Boolean).join(' - ') || 'Ek bilgi yok'
                          : product.error}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveProduct(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            {parsedProducts.length === 0 && <div className="text-center py-6 text-muted-foreground"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Hic urun bulunamadi</p></div>}
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={validCount === 0} className="flex-1"><Check className="w-4 h-4 mr-2" />{validCount} Urun Ekle</Button>
              <Button variant="outline" onClick={() => { setIsParsed(false); setParsedProducts([]); setFileName('') }}>Geri</Button>
              <Button variant="outline" onClick={onCancel}>Iptal</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

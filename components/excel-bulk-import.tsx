"use client"

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileSpreadsheet, Upload, Check, X, AlertCircle, Package, Trash2, ArrowRight } from 'lucide-react'
import type { ParsedProduct, ProductWithStock, Reyon } from '@/lib/types'

const NO_REYON = '__none__'

interface ExcelBulkImportProps {
  existingProducts: ProductWithStock[]
  reyons: Reyon[]
  defaultReyonId?: string | null
  onAdd: (products: ParsedProduct[], reyonId: string | null) => void
  onCancel: () => void
}

type FieldKey = 'name' | 'stockCode' | 'brand' | 'barcode'

const FIELD_LABELS: Record<FieldKey, string> = {
  name: 'Urun Adi',
  stockCode: 'Stok Kodu',
  brand: 'Marka',
  barcode: 'Barkod',
}

const FIELD_ORDER: FieldKey[] = ['name', 'stockCode', 'brand', 'barcode']

function normalizeHeader(h: string): string {
  return String(h || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '')
}

function guessColumn(headers: string[], keywords: string[]): number {
  return headers.findIndex((h) => keywords.some((k) => normalizeHeader(h).includes(k)))
}

function readWorkbook(buffer: ArrayBuffer): { headers: string[]; rows: unknown[][]; error?: string } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { headers: [], rows: [], error: 'Dosyada sayfa bulunamadi.' }

  const allRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  if (allRows.length < 2) return { headers: [], rows: [], error: 'Dosyada basliktan sonra veri satiri bulunamadi.' }

  const headers = (allRows[0] as unknown[]).map((h) => String(h ?? '').trim() || '(bos)')
  return { headers, rows: allRows.slice(1) }
}

function buildProducts(
  rows: unknown[][],
  mapping: Record<FieldKey, number>
): ParsedProduct[] {
  const products: ParsedProduct[] = []
  const cell = (row: unknown[], idx: number) => (idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '')
  for (const row of rows) {
    if (!row || row.length === 0) continue
    const name = cell(row, mapping.name)
    if (!name) continue
    products.push({
      name,
      stockCode: cell(row, mapping.stockCode) || undefined,
      brand: cell(row, mapping.brand) || undefined,
      barcode: cell(row, mapping.barcode) || undefined,
      isValid: true,
    })
  }
  return products
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

export function ExcelBulkImport({ existingProducts, reyons, defaultReyonId, onAdd, onCancel }: ExcelBulkImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
  const [reyonChoice, setReyonChoice] = useState(defaultReyonId || NO_REYON)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<unknown[][]>([])
  const [mapping, setMapping] = useState<Record<FieldKey, number>>({ name: -1, stockCode: -1, brand: -1, barcode: -1 })
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [parseError, setParseError] = useState('')

  const handleFile = async (file: File) => {
    setParseError('')
    setFileName(file.name)
    try {
      const buffer = await file.arrayBuffer()
      const { headers: h, rows: r, error } = readWorkbook(buffer)
      if (error) {
        setParseError(error)
        return
      }
      setHeaders(h)
      setRows(r)
      setMapping({
        name: guessColumn(h, ['urun', 'ad', 'isim', 'name']),
        stockCode: guessColumn(h, ['stok', 'kod', 'code']),
        brand: guessColumn(h, ['marka', 'brand']),
        barcode: guessColumn(h, ['barkod', 'barcode']),
      })
      setStep('mapping')
    } catch {
      setParseError('Dosya okunamadi. Lutfen gecerli bir .xlsx veya .csv dosyasi secin.')
    }
  }

  const handleConfirmMapping = () => {
    const products = buildProducts(rows, mapping)
    setParsedProducts(markDuplicates(products, existingProducts))
    setStep('preview')
  }

  const handleRemoveProduct = (index: number) => {
    setParsedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const validProducts = parsedProducts.filter((p) => p.isValid)
    if (validProducts.length > 0) onAdd(validProducts, reyonChoice === NO_REYON ? null : reyonChoice)
  }

  const validCount = parsedProducts.filter((p) => p.isValid).length
  const skippedCount = parsedProducts.filter((p) => !p.isValid).length

  return (
    <Card className="border-primary/20 py-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Excel ile Toplu Ekle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'upload' && (
          <>
            <div>
              <p className="text-sm font-medium mb-2">Dosyaniz su duzende olmali:</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="px-2 py-1.5 text-left font-medium border-r border-border">Urun Adi</th>
                      <th className="px-2 py-1.5 text-left font-medium border-r border-border">Stok Kodu</th>
                      <th className="px-2 py-1.5 text-left font-medium border-r border-border">Marka</th>
                      <th className="px-2 py-1.5 text-left font-medium">Barkod</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1.5 border-r border-t border-border text-muted-foreground">Ornek Urun 1kg</td>
                      <td className="px-2 py-1.5 border-r border-t border-border text-muted-foreground">123456</td>
                      <td className="px-2 py-1.5 border-r border-t border-border text-muted-foreground">Ornek Marka</td>
                      <td className="px-2 py-1.5 border-t border-border text-muted-foreground">(bos birakilabilir)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Sutun adlari farkli yazilmis olsa da olur; dosyayi yukledikten sonra hangi sutunun ne oldugunu kendiniz secersiniz.
              </p>
            </div>

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
        )}

        {step === 'mapping' && (
          <>
            <p className="text-sm text-muted-foreground">
              Dosyanizdaki hangi sutun bizim hangi bilgimize karsilik geliyor, asagidan secin. &quot;Urun Adi&quot; secmeniz zorunlu, digerleri istege baglidir.
            </p>
            <div className="space-y-3">
              {FIELD_ORDER.map((field) => (
                <div key={field} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24 shrink-0">{FIELD_LABELS[field]}{field === 'name' && ' *'}</span>
                  <Select
                    value={mapping[field] === -1 ? 'none' : String(mapping[field])}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v === 'none' ? -1 : parseInt(v) }))}
                  >
                    <SelectTrigger className="h-10 flex-1"><SelectValue placeholder="Dosyanizdaki sutunu secin" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bu bilgi dosyamda yok</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {headers.length > 0 && rows.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dosyanizdan ilk satir ornegi:</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60">
                        {headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-medium border-r border-border last:border-r-0">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {headers.map((_, i) => <td key={i} className="px-2 py-1.5 border-r border-t border-border last:border-r-0 text-muted-foreground truncate max-w-[120px]">{String((rows[0]?.[i] ?? '') || '-')}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmMapping}
                disabled={mapping.name === -1}
                className="flex-1"
              >
                Devam Et<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => { setStep('upload'); setFileName('') }}>Geri</Button>
              <Button variant="outline" onClick={onCancel}>Iptal</Button>
            </div>
          </>
        )}

        {step === 'preview' && (
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

            {reyons.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Bu urunler hangi reyona eklensin?</label>
                <Select value={reyonChoice} onValueChange={setReyonChoice}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_REYON}>Reyonsuz ekle</SelectItem>
                    {reyons.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={validCount === 0} className="flex-1"><Check className="w-4 h-4 mr-2" />{validCount} Urun Ekle</Button>
              <Button variant="outline" onClick={() => setStep('mapping')}>Geri</Button>
              <Button variant="outline" onClick={onCancel}>Iptal</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

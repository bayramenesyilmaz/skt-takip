'use client'

import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, FileText, Check, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

type Step = 'upload' | 'map' | 'review' | 'import'

const fieldOptions = [
  { value: '', label: 'Atla' },
  { value: 'name', label: 'Urun Adi' },
  { value: 'expiryDate', label: 'Son Kullanma' },
  { value: 'stockCode', label: 'Stok Kodu' },
  { value: 'barcode', label: 'Barkod' },
  { value: 'brand', label: 'Marka' },
]

export default function ImportPage() {
  const { addProduct, addBrand, brands } = useAppData()

  const [step, setStep] = useState<Step>('upload')
  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: number; fail: number } | null>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result || '')
      setRawText(text)
      parseText(text)
    }
    reader.readAsText(file)
  }

  const parseText = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return
    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
    const parsedHeaders = lines[0].split(delimiter).map((h) => h.trim())
    const parsedRows = lines.slice(1).map((l) => l.split(delimiter).map((c) => c.trim()))
    setHeaders(parsedHeaders)
    setRows(parsedRows)
    const auto: Record<string, string> = {}
    parsedHeaders.forEach((h) => {
      const lower = h.toLowerCase()
      if (lower.includes('ad') || lower.includes('name')) auto[h] = 'name'
      else if (lower.includes('tarih') || lower.includes('date') || lower.includes('skt')) auto[h] = 'expiryDate'
      else if (lower.includes('kod') || lower.includes('code')) auto[h] = 'stockCode'
      else if (lower.includes('barkod') || lower.includes('bar')) auto[h] = 'barcode'
      else if (lower.includes('marka') || lower.includes('brand')) auto[h] = 'brand'
    })
    setMapping(auto)
  }

  const handlePaste = (text: string) => {
    setRawText(text)
    if (text.trim()) parseText(text)
  }

  const parsedProducts = useMemo(() => {
    return rows.map((row) => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        const field = mapping[h]
        if (field) obj[field] = row[i] || ''
      })
      return obj
    })
  }, [rows, headers, mapping])

  const validProducts = parsedProducts.filter((p) => p.name)
  const invalidProducts = parsedProducts.filter((p) => !p.name)

  const handleImport = async () => {
    setImporting(true)
    let ok = 0, fail = 0
    const brandMap: Record<string, string> = {}
    brands.forEach((b: any) => { brandMap[b.name.toLowerCase()] = b.id })

    for (const p of validProducts) {
      try {
        let brandId = p.brand ? brandMap[p.brand.toLowerCase()] : undefined
        if (p.brand && !brandId) {
          const newBrand = await addBrand({ name: p.brand, return_accepts: true })
          if (newBrand?.id) { brandMap[p.brand.toLowerCase()] = newBrand.id; brandId = newBrand.id }
        }
        await addProduct({
          name: p.name,
          expiryDate: p.expiryDate || undefined,
          stock_code: p.stockCode || undefined,
          barcode: p.barcode || undefined,
          brand_id: brandId,
        })
        ok++
      } catch {
        fail++
      }
    }
    setImportResult({ ok, fail })
    setImporting(false)
    setStep('import')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Import</h1>
          <Badge variant="outline" className="ml-auto">
            {step === 'upload' ? '1/4' : step === 'map' ? '2/4' : step === 'review' ? '3/4' : '4/4'}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {step === 'upload' && (
          <Card className="p-4 space-y-3">
            <Label>Dosya Yukle veya Yapistir</Label>
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {fileName && <p className="text-xs text-gray-500 flex items-center gap-1"><FileText className="w-3 h-3" />{fileName}</p>}
            <textarea
              className="w-full border rounded p-2 text-sm h-32 font-mono"
              placeholder="Veya veriyi buraya yapistirin..."
              value={rawText}
              onChange={(e) => handlePaste(e.target.value)}
            />
            <Button disabled={!rawText.trim()} onClick={() => setStep('map')}>
              Devam <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        )}

        {step === 'map' && (
          <Card className="p-4 space-y-3">
            <Label>Kolon Eslestirme</Label>
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <span className="text-sm w-32 truncate">{h}</span>
                <Select value={mapping[h] || ''} onValueChange={(v) => setMapping({ ...mapping, [h]: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Atla" /></SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button disabled={!Object.values(mapping).some((v) => v === 'name')} onClick={() => setStep('review')}>
              Devam <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        )}

        {step === 'review' && (
          <Card className="p-4 space-y-3">
            <div className="flex gap-2">
              <Badge variant="default">{validProducts.length} gecerli</Badge>
              <Badge variant="destructive">{invalidProducts.length} gecersiz</Badge>
            </div>
            <div className="max-h-64 overflow-auto">
              {validProducts.slice(0, 20).map((p, i) => (
                <div key={i} className="text-xs border-b py-1 flex gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>{p.name}</span>
                  {p.expiryDate && <span className="text-gray-500">- {p.expiryDate}</span>}
                </div>
              ))}
              {invalidProducts.slice(0, 5).map((p, i) => (
                <div key={i} className="text-xs border-b py-1 flex gap-2">
                  <X className="w-3 h-3 text-red-500" />
                  <span className="text-gray-400">Isim eksik</span>
                </div>
              ))}
            </div>
            <Button disabled={importing || validProducts.length === 0} onClick={handleImport}>
              {importing ? 'Import ediliyor...' : `${validProducts.length} urunu import et`}
            </Button>
          </Card>
        )}

        {step === 'import' && (
          <Card className="p-4 text-center space-y-2">
            {importResult && (
              <>
                <Check className="w-12 h-12 text-green-500 mx-auto" />
                <p className="font-medium">Import tamamlandi</p>
                <p className="text-sm text-gray-500">{importResult.ok} basarili, {importResult.fail} basarisiz</p>
                <Link href="/app/liste"><Button variant="outline">Listeyi Gor</Button></Link>
              </>
            )}
          </Card>
        )}
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardPaste, Check, X, AlertCircle, Package, Trash2 } from 'lucide-react'
import type { ParsedProduct } from '@/lib/types'

interface BulkProductAddProps {
  onAdd: (products: ParsedProduct[]) => void
  onCancel: () => void
}

export function BulkProductAdd({ onAdd, onCancel }: BulkProductAddProps) {
  const [text, setText] = useState('')
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [isParsed, setIsParsed] = useState(false)

  const handleParse = () => {
    if (!text.trim()) return
    const products = parseProductsFromText(text)
    setParsedProducts(products)
    setIsParsed(true)
  }

  const handleRemoveProduct = (index: number) => {
    setParsedProducts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const validProducts = parsedProducts.filter((p) => p.isValid)
    if (validProducts.length > 0) onAdd(validProducts)
  }

  const validCount = parsedProducts.filter((p) => p.isValid).length
  const invalidCount = parsedProducts.filter((p) => !p.isValid).length

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) } catch { return dateStr }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><ClipboardPaste className="w-5 h-5" />Toplu Urun Ekle</CardTitle>
        <p className="text-sm text-muted-foreground">WhatsApp veya mesajdan kopyaladiginiz urunleri asagiya yapistiriniz.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isParsed ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Urun Listesi</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder={`Ornek format:\nMetin harnup pekmez cam 380gr - 01/11/2026\nMetin dut pekmez cam 380gr - 01/12/2027`}
                className="w-full h-40 p-3 text-sm border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <p className="text-xs text-muted-foreground">Her urun yeni satirda olmali ve tarih formati GG/AA/YYYY seklinde olmalidir.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleParse} disabled={!text.trim()} className="flex-1"><Check className="w-4 h-4 mr-2" />Ayristir ve Kontrol Et</Button>
              <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Iptal</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600"><Check className="w-3 h-3 mr-1" />{validCount} gecerli urun</Badge>
              {invalidCount > 0 && <Badge variant="secondary" className="bg-red-500/10 text-red-600"><AlertCircle className="w-3 h-3 mr-1" />{invalidCount} hatali urun</Badge>}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedProducts.map((product, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${product.isValid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Package className={`w-4 h-4 shrink-0 ${product.isValid ? 'text-emerald-600' : 'text-red-600'}`} />
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{product.name}</p><p className={`text-xs ${product.isValid ? 'text-muted-foreground' : 'text-red-600'}`}>{product.isValid ? `SKT: ${formatDate(product.expiryDate)}` : product.error}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveProduct(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
            {parsedProducts.length === 0 && <div className="text-center py-6 text-muted-foreground"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Hic urun bulunamadi</p></div>}
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={validCount === 0} className="flex-1"><Check className="w-4 h-4 mr-2" />{validCount} Urun Ekle</Button>
              <Button variant="outline" onClick={() => { setIsParsed(false); setParsedProducts([]) }}>Geri</Button>
              <Button variant="outline" onClick={onCancel}>Iptal</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function parseProductsFromText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = []
  const lines = text.split(/\n/).filter((line) => line.trim())
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    const dateMatch = trimmedLine.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dateMatch) {
      const [fullMatch, day, month, year] = dateMatch
      const namePart = trimmedLine.substring(0, trimmedLine.indexOf(fullMatch))
      const name = namePart.replace(/\s*-\s*$/, '').trim()
      if (name) {
        const expiryDate = `${year}-${month}-${day}`
        const dateObj = new Date(expiryDate)
        const isValidDate = !isNaN(dateObj.getTime())
        products.push({ name, expiryDate, isValid: isValidDate, error: isValidDate ? undefined : 'Gecersiz tarih' })
      }
    }
  }
  return products
}

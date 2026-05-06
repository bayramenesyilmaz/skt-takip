"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { FileText, Download, CheckCircle2, Package, Filter } from 'lucide-react'

export default function RaporPage() {
  const { activeProducts, settings, isLoading } = useProductStore()
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map())
  const [showConfirm, setShowConfirm] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showNoReturnOnly, setShowNoReturnOnly] = useState(false)

  // Kampanya urunleri - tip bazli filtreleme
  const campaignProducts = useMemo(() => {
    if (!Array.isArray(activeProducts)) return []
    
    let filtered = activeProducts.filter(p => {
      const info = getExpiryInfoByType(p.expiryDate, p.productType)
      return info.status === 'campaign'
    })

    // Tip filtresi
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => (p.productType || 'shelf') === typeFilter)
    }

    // Iade almayan markalar filtresi
    if (showNoReturnOnly && settings.noReturnBrands.length > 0) {
      filtered = filtered.filter(p => 
        p.brand && settings.noReturnBrands.some(b => 
          p.brand?.toLowerCase().includes(b.toLowerCase())
        )
      )
    }

    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
      const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [activeProducts, typeFilter, showNoReturnOnly, settings.noReturnBrands])

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
      quantities.delete(id)
    } else {
      newSelected.add(id)
      setQuantities(new Map(quantities.set(id, 1)))
    }
    setSelectedIds(newSelected)
  }

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      selectedIds.delete(id)
      quantities.delete(id)
    } else {
      selectedIds.add(id)
      quantities.set(id, qty)
    }
    setSelectedIds(new Set(selectedIds))
    setQuantities(new Map(quantities))
  }

  const selectAll = () => {
    const newSelected = new Set<string>()
    const newQuantities = new Map<string, number>()
    campaignProducts.forEach(p => {
      newSelected.add(p.id)
      newQuantities.set(p.id, 1)
    })
    setSelectedIds(newSelected)
    setQuantities(newQuantities)
  }

  const clearAll = () => {
    setSelectedIds(new Set())
    setQuantities(new Map())
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const generatePDF = () => {
    const selected = campaignProducts.filter(p => selectedIds.has(p.id))
    if (selected.length === 0) return

    const today = new Date().toLocaleDateString('tr-TR')
    
    let tableRows = ''
    selected.forEach((product, idx) => {
      const qty = quantities.get(product.id) || 1
      const info = getExpiryInfoByType(product.expiryDate, product.productType)
      tableRows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${product.stockCode || '-'}</td>
          <td>${product.name}</td>
          <td>${product.barcode || '-'}</td>
          <td>${product.brand || '-'}</td>
          <td>${formatDate(product.expiryDate)}</td>
          <td>${info.daysLeft} gun</td>
          <td style="border: 1px solid #333; width: 60px;">${qty}</td>
        </tr>
      `
    })

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kampanya Raporu - ${today}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
            .date { text-align: center; font-size: 11px; color: #666; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background: #fafafa; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; }
            .signature { border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 5px; }
            @media print { body { margin: 10px; } }
          </style>
        </head>
        <body>
          <h1>KAMPANYA RAPORU</h1>
          <p class="date">Tarih: ${today} | Toplam: ${selected.length} urun</p>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Stok Kodu</th>
                <th>Urun Adi</th>
                <th>Barkod</th>
                <th>Marka</th>
                <th>SKT</th>
                <th>Kalan</th>
                <th>Adet</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="footer">
            <div class="signature">Hazirlayan</div>
            <div class="signature">Onaylayan</div>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kampanya-raporu-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Kampanya Raporu</h1>
                <p className="text-xs text-muted-foreground">{campaignProducts.length} urun</p>
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex gap-2 items-center">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Tipler</SelectItem>
                <SelectItem value="shelf">Normal Raf</SelectItem>
                <SelectItem value="freezer-18">-18C Dolap</SelectItem>
                <SelectItem value="fridge-4">+4C Dolap</SelectItem>
                <SelectItem value="processed">Islenmis</SelectItem>
              </SelectContent>
            </Select>

            {settings.noReturnBrands.length > 0 && (
              <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                <Label className="text-xs whitespace-nowrap">Iade Almayan</Label>
                <Switch 
                  checked={showNoReturnOnly} 
                  onCheckedChange={setShowNoReturnOnly}
                  className="scale-75"
                />
              </div>
            )}
          </div>

          {/* Secim butonlari */}
          <div className="flex gap-2">
            {selectedIds.size > 0 ? (
              <>
                <Button variant="outline" size="sm" onClick={clearAll} className="flex-1 h-8 text-xs">
                  Temizle ({selectedIds.size})
                </Button>
                <Button size="sm" onClick={() => setShowConfirm(true)} className="flex-1 h-8 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  PDF Indir
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={selectAll} className="flex-1 h-8 text-xs">
                Tumunu Sec
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-2">
        {campaignProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Kampanya urunu yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {showNoReturnOnly ? 'Iade almayan marka filtresi aktif' : 'Filtre kriterlerine uyan urun bulunamadi'}
            </p>
          </div>
        ) : (
          campaignProducts.map(product => {
            const info = getExpiryInfoByType(product.expiryDate, product.productType)
            const isSelected = selectedIds.has(product.id)
            const qty = quantities.get(product.id) || 1
            const isNoReturn = product.brand && settings.noReturnBrands.some(b => 
              product.brand?.toLowerCase().includes(b.toLowerCase())
            )

            return (
              <Card
                key={product.id}
                className={`cursor-pointer border transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <h3 className="font-medium text-sm text-foreground truncate">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">
                          {info.daysLeft} gun
                        </Badge>
                        {product.brand && (
                          <Badge variant={isNoReturn ? "destructive" : "secondary"} className="text-xs px-1.5 py-0">
                            {product.brand}
                            {isNoReturn && ' (iade yok)'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        SKT: {formatDate(product.expiryDate)}
                        {product.stockCode && ` | Stok: ${product.stockCode}`}
                      </div>
                    </div>

                    {isSelected && (
                      <div 
                        className="flex items-center gap-1 bg-background border rounded px-2 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateQuantity(product.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          -
                        </button>
                        <Input
                          type="number"
                          value={qty}
                          onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                          className="w-12 h-6 text-center text-sm border-0 p-0"
                          min="0"
                        />
                        <button
                          onClick={() => updateQuantity(product.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Onay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">PDF Indir</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIds.size} urun raporu indirilecek.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                  Iptal
                </Button>
                <Button onClick={() => { generatePDF(); setShowConfirm(false) }} className="flex-1">
                  Indir
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

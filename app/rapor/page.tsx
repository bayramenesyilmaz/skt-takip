"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { FileText, Download, Trash2, CheckCircle2, Download as DownloadIcon } from 'lucide-react'
import type { Product } from '@/lib/types'

export default function RaporPage() {
  const { products = [] } = useProductStore()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map())
  const [showConfirm, setShowConfirm] = useState(false)

  // 1-3 ayı kalan ürünleri getir
  const campaignProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    return products
      .filter(p => {
        const info = getExpiryInfo(p.expiryDate)
        return info.status === 'campaign' && p.stockCode !== '0'
      })
      .sort((a, b) => {
        const aInfo = getExpiryInfo(a.expiryDate)
        const bInfo = getExpiryInfo(b.expiryDate)
        return aInfo.daysLeft - bInfo.daysLeft
      })
  }, [products])

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
    } else {
      selectedIds.add(id)
    }
    setSelectedIds(new Set(selectedIds))
    setQuantities(new Map(quantities.set(id, qty)))
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

  const generateText = () => {
    const selected = campaignProducts.filter(p => selectedIds.has(p.id))
    if (selected.length === 0) return ''

    let text = '📋 KAMPANYA RAPORU\n'
    text += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n\n`
    text += '✏️ Toplu Ekleme Formatı:\n'
    text += '─'.repeat(50) + '\n'

    selected.forEach(product => {
      const qty = quantities.get(product.id) || 1
      const sktDate = new Date(product.expiryDate).toLocaleDateString('tr-TR')
      text += `${product.name} | ${sktDate}\n`
    })

    text += '─'.repeat(50) + '\n\n'
    text += '📊 Özet:\n'
    text += `Toplam Ürün: ${selected.length}\n`
    text += `Kopyalama Formatı (Ctrl+C):\n`
    text += '─'.repeat(50) + '\n'

    let copyText = ''
    selected.forEach(product => {
      const qty = quantities.get(product.id) || 1
      const sktDate = new Date(product.expiryDate).toLocaleDateString('tr-TR')
      copyText += `${product.name} | ${sktDate}\n`
    })

    return { text, copyText }
  }

  const generatePDF = () => {
    const selected = campaignProducts.filter(p => selectedIds.has(p.id))
    if (selected.length === 0) return

    const { text, copyText } = generateText()

    let html = `
      <html dir="ltr">
        <head>
          <meta charset="utf-8">
          <title>Kampanya Raporu</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; line-height: 1.6; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 10px; }
            .date { text-align: right; font-size: 12px; color: #666; margin-bottom: 20px; }
            .content { white-space: pre-wrap; font-size: 13px; }
            .divider { border-bottom: 1px solid #ddd; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>📋 KAMPANYA RAPORU</h1>
          <div class="date">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
          
          <div class="content">${copyText}</div>
          
          <div style="margin-top: 30px; text-align: right;">
            <p>İmza: _____________________ Tarih: _____/_____/_____</p>
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Kampanya Raporu</h1>
              <p className="text-xs text-muted-foreground">1-3 ay kalan ürünler</p>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="flex-1 text-xs h-9"
                >
                  Temizle
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  className="flex-1 text-xs h-9"
                >
                  <DownloadIcon className="w-3 h-3 mr-1" />
                  PDF İndir
                </Button>
              </>
            )}
            {selectedIds.size !== campaignProducts.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="flex-1 text-xs h-9"
              >
                Tümünü Seç
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {campaignProducts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">Kampanya ürünü bulunamadı</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-2 pb-2">
              {selectedIds.size} / {campaignProducts.length} seçildi
            </p>
            {campaignProducts.map(product => {
              const info = getExpiryInfo(product.expiryDate)
              const isSelected = selectedIds.has(product.id)
              const qty = quantities.get(product.id) || 1

              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer border transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500'
                      : 'bg-amber-500/5 hover:bg-amber-500/10'
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className="bg-amber-500 text-white text-xs">
                            {info.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(product.expiryDate)}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 bg-background rounded px-2 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, qty - 1)
                            }}
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, parseInt(e.target.value) || 0)
                            }}
                            className="w-10 bg-background text-center text-sm font-medium border-0 outline-0"
                            min="0"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(product.id, qty + 1)
                            }}
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
            })}
          </>
        )}
      </div>

      {/* Onay Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">PDF İndir?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedIds.size} ürünün raporu indirilecek.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => {
                    generatePDF()
                    setShowConfirm(false)
                  }}
                  className="flex-1"
                >
                  Devam Et
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

"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCard } from '@/components/product-card'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { ArrowLeft, FileText, Download, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'

interface SelectedProduct extends Product {
  quantity?: number
}

export default function RaporPage() {
  const router = useRouter()
  const { products, locations } = useProductStore()
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map())
  const [showConfirm, setShowConfirm] = useState(false)

  // 1-3 ayı kalan ürünleri getir
  const campaignProducts = useMemo(() => {
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

  const handleSelectProduct = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      selectedProducts.delete(productId)
      setSelectedProducts(new Map(selectedProducts))
    } else {
      setSelectedProducts(new Map(selectedProducts.set(productId, quantity)))
    }
  }

  const handleSelectAll = () => {
    const newSelected = new Map<string, number>()
    campaignProducts.forEach(p => {
      newSelected.set(p.id, 1)
    })
    setSelectedProducts(newSelected)
  }

  const handleClearAll = () => {
    setSelectedProducts(new Map())
  }

  const generatePDF = () => {
    const doc = document.createElement('div')
    doc.style.display = 'none'
    
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              margin-bottom: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f5f5f5;
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            td {
              border: 1px solid #ddd;
              padding: 10px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total {
              font-weight: bold;
              background-color: #f5f5f5;
            }
            .summary {
              margin-top: 30px;
              padding: 15px;
              background-color: #f9f9f9;
              border-left: 4px solid #000;
            }
          </style>
        </head>
        <body>
          <h1>Kampanya Ürünleri Raporu</h1>
          <div class="meta">
            <p>Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
            <p>Hazırlanma Saati: ${new Date().toLocaleTimeString('tr-TR')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>SKT Tarihi</th>
                <th>Kalan Gün</th>
                <th>Adet</th>
              </tr>
            </thead>
            <tbody>
    `

    let totalItems = 0
    selectedProducts.forEach((quantity, productId) => {
      const product = products.find(p => p.id === productId)
      if (product) {
        const info = getExpiryInfo(product.expiryDate)
        const expiryDate = new Date(product.expiryDate).toLocaleDateString('tr-TR')
        html += `
          <tr>
            <td>${product.name}</td>
            <td>${expiryDate}</td>
            <td>${info.daysLeft}</td>
            <td style="text-align: center; font-weight: bold;">${quantity}</td>
          </tr>
        `
        totalItems += quantity
      }
    })

    html += `
            </tbody>
          </table>
          
          <div class="summary">
            <p><strong>Toplam Ürün Sayısı:</strong> ${selectedProducts.size}</p>
            <p><strong>Toplam Adet:</strong> ${totalItems}</p>
            <p><strong>Kampanya Başlangıç Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </body>
      </html>
    `

    // HTML'i yazdır
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  if (campaignProducts.length === 0) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-foreground">Kampanya Raporu</h1>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Rapor Bulunamadı</h3>
          <p className="text-sm text-muted-foreground">
            1-3 ayı kalan ürün yok
          </p>
        </div>

        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2 text-foreground">PDF Çıktısı Alınacak</h2>
            <p className="text-muted-foreground mb-4">
              {selectedProducts.size} ürün, toplam {
                Array.from(selectedProducts.values()).reduce((a, b) => a + b, 0)
              } adet seçilmiştir. Devam etmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                İptal
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  generatePDF()
                  setShowConfirm(false)
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Kampanya Raporu</h1>
              <p className="text-xs text-muted-foreground">1-3 ayı kalan ürünler</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {selectedProducts.size}/{campaignProducts.length}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <Button 
              variant="secondary" 
              size="sm"
              className="flex-1 text-xs h-9"
              onClick={handleSelectAll}
            >
              Hepsini Seç
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 text-xs h-9"
              onClick={handleClearAll}
            >
              Seçimi Temizle
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="space-y-3">
          {campaignProducts.map((product) => {
            const isSelected = selectedProducts.has(product.id)
            const quantity = selectedProducts.get(product.id) || 1

            return (
              <div key={product.id} className="relative">
                <ProductCard
                  product={product}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  locationName={(() => {
                    const loc = locations.find(l => l.id === product.locationId)
                    if (!loc) return undefined
                    const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : undefined
                    return parent ? `${parent.name} / ${loc.name}` : loc.name
                  })()}
                  compact
                />

                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-lg border-2 border-primary flex items-center justify-end p-3 pointer-events-none">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}

                {/* Quantity Input */}
                {isSelected && (
                  <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <label className="text-xs font-medium text-muted-foreground block mb-2">
                      Adet
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        handleSelectProduct(product.id, val)
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                {/* Select Button */}
                <Button 
                  variant={isSelected ? "default" : "secondary"}
                  size="sm"
                  className="w-full mt-2 text-xs h-9"
                  onClick={() => {
                    if (isSelected) {
                      handleSelectProduct(product.id, 0)
                    } else {
                      handleSelectProduct(product.id, 1)
                    }
                  }}
                >
                  {isSelected ? '✓ Seçili' : 'Seç'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-24 right-4 left-4 max-w-xs mx-auto">
          <Button 
            className="w-full"
            onClick={() => setShowConfirm(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF İndir ({selectedProducts.size} ürün)
          </Button>
        </div>
      )}

      <BottomNav />
    </main>
  )
}

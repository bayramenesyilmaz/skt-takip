"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { ArrowLeft, Package, AlertCircle, Edit2, Trash2 } from 'lucide-react'

export default function EksikPage() {
  const store = useProductStore() || {}
  const { 
    activeProducts = [], 
    updateProduct = () => {}, 
    setStockZero = () => {}, 
    isLoading = false, 
    getBrands = () => [] 
  } = store
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editType, setEditType] = useState<'brand' | 'type' | null>(null)
  const [editValue, setEditValue] = useState('')
  const brands = getBrands()

  const incompleteProducts = useMemo(() => {
    if (!Array.isArray(activeProducts)) return []
    
    return activeProducts.filter(p => 
      !p.brand || !p.productType
    ).sort((a, b) => {
      const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
      const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [activeProducts])

  const handleEditSave = (productId: string) => {
    const product = activeProducts.find(p => p.id === productId)
    if (!product) return

    updateProduct(productId, {
      name: product.name,
      stockCode: product.stockCode,
      barcode: product.barcode,
      brand: editType === 'brand' ? editValue : product.brand,
      expiryDate: product.expiryDate,
      productType: editType === 'type' ? (editValue as any) : product.productType,
    })

    setEditingId(null)
    setEditType(null)
    setEditValue('')
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
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-bold text-foreground">Eksik Bilgiler</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-2">
        {incompleteProducts.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {incompleteProducts.length} ürünün marka veya tip bilgisi eksik
            </p>
            {incompleteProducts.map(product => {
              const info = getExpiryInfoByType(product.expiryDate, product.productType)
              return (
                <Card key={product.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {info.label}
                          </Badge>
                          {!product.brand && (
                            <Badge variant="destructive" className="text-xs">
                              Marka Yok
                            </Badge>
                          )}
                          {!product.productType && (
                            <Badge variant="destructive" className="text-xs">
                              Tip Yok
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => setStockZero(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Brand Edit */}
                    {!product.brand && (
                      <div className="flex gap-2 pt-2 border-t">
                        {editingId === product.id && editType === 'brand' ? (
                          <>
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 h-8 px-2 text-sm border rounded-md"
                            >
                              <option value="">Marka Sec</option>
                              {brands.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                            <Button size="sm" className="h-8" onClick={() => handleEditSave(product.id)}>
                              Kaydet
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setEditingId(product.id)
                              setEditType('brand')
                              setEditValue('')
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Marka Ekle
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Type Edit */}
                    {!product.productType && (
                      <div className="flex gap-2 pt-2 border-t">
                        {editingId === product.id && editType === 'type' ? (
                          <>
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 h-8 px-2 text-sm border rounded-md"
                            >
                              <option value="">Tip Sec</option>
                              <option value="shelf">Normal Raf (14 gün)</option>
                              <option value="freezer-18">-18°C Dolap (14 gün)</option>
                              <option value="fridge-4">+4°C Dolap (3 gün)</option>
                              <option value="processed">İşlenmiş (5-10 gün)</option>
                            </select>
                            <Button size="sm" className="h-8" onClick={() => handleEditSave(product.id)}>
                              Kaydet
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setEditingId(product.id)
                              setEditType('type')
                              setEditValue('')
                            }}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Tip Ekle
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Tüm ürünler tamam!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tüm ürünlerin marka ve tip bilgileri tamamlandı
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

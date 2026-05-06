"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { Search, X, ArrowLeft, Package, RefreshCw, Trash2 } from 'lucide-react'

export default function Stok0Page() {
  const { zeroStockProducts, restoreProduct, deleteProduct, isLoading } = useProductStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [actionModal, setActionModal] = useState<{ id: string; action: 'restore' | 'delete' } | null>(null)

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(zeroStockProducts)) return []
    
    let filtered = zeroStockProducts

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }

    return filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [zeroStockProducts, searchQuery])

  const handleAction = () => {
    if (!actionModal) return
    
    if (actionModal.action === 'restore') {
      restoreProduct(actionModal.id)
    } else {
      deleteProduct(actionModal.id)
    }
    setActionModal(null)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">Stok 0</h1>
              <p className="text-xs text-muted-foreground">{filteredProducts.length} urun</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Stok 0 urun yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Silinen urunler burada gorunur
            </p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const info = getExpiryInfoByType(product.expiryDate, product.productType)
            
            return (
              <Card key={product.id} className="bg-gray-50 border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {info.daysLeft} gun
                        </Badge>
                        {product.brand && (
                          <span className="text-xs text-muted-foreground">{product.brand}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        SKT: {formatDate(product.expiryDate)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setActionModal({ id: product.id, action: 'restore' })}
                      >
                        <RefreshCw className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setActionModal({ id: product.id, action: 'delete' })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {actionModal.action === 'restore' ? 'Geri Yukle?' : 'Tamamen Sil?'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {actionModal.action === 'restore' 
                    ? 'Bu urunun stoku 1 yapilacak ve listeye donecek.'
                    : 'Bu urun sistemden kalici olarak silinecek. Bu islem geri alinamaz.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActionModal(null)} className="flex-1">
                  Iptal
                </Button>
                <Button 
                  variant={actionModal.action === 'delete' ? 'destructive' : 'default'}
                  onClick={handleAction} 
                  className="flex-1"
                >
                  {actionModal.action === 'restore' ? 'Geri Yukle' : 'Sil'}
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

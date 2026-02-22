"use client"

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { Search, Edit2, X, Clock, MapPin } from 'lucide-react'
import type { Product } from '@/lib/types'

const statusConfig: Record<string, { bg: string; badge: string }> = {
  expired: { bg: 'bg-destructive/10', badge: 'bg-destructive' },
  critical: { bg: 'bg-destructive/5', badge: 'bg-destructive/90' },
  remove: { bg: 'bg-orange-500/10', badge: 'bg-orange-500' },
  campaign: { bg: 'bg-amber-500/10', badge: 'bg-amber-500' },
  safe: { bg: 'bg-emerald-500/10', badge: 'bg-emerald-500' },
}

export default function ListePage() {
  const { products, locations, updateProduct, reduceProductToZero } = useProductStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.stockCode !== '0')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => getExpiryInfo(p.expiryDate).status === statusFilter)
    }

    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfo(a.expiryDate)
      const bInfo = getExpiryInfo(b.expiryDate)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [products, searchQuery, statusFilter])

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setEditValue(product.name)
  }

  const handleSave = (id: string) => {
    const product = products.find(p => p.id === id)
    if (product && editValue.trim()) {
      updateProduct(id, { ...product, name: editValue.trim() })
      setEditingId(null)
    }
  }

  const handleZeroStock = (id: string) => {
    reduceProductToZero(id)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getLocationName = (locationId?: string) => {
    if (!locationId) return null
    const loc = locations.find(l => l.id === locationId)
    if (!loc) return null
    const parent = loc.parentId ? locations.find(l => l.id === loc.parentId) : null
    return parent ? `${parent.name} / ${loc.name}` : loc.name
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <h1 className="text-lg font-bold text-foreground">Urunler</h1>
          
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
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

          {/* Filtreler */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Tumu
            </button>
            {['expired', 'critical', 'remove', 'campaign', 'safe'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-primary-foreground'
                    : `bg-muted text-muted-foreground hover:text-foreground`
                }`}
              >
                {status === 'expired' && 'Gecmis'}
                {status === 'critical' && 'Kritik'}
                {status === 'remove' && 'Kaldir'}
                {status === 'campaign' && 'Kampanya'}
                {status === 'safe' && 'Guvenli'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Sonuc bulunamadi</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-2 pb-2">
              {filteredProducts.length} urun
            </p>
            {filteredProducts.map(product => {
              const info = getExpiryInfo(product.expiryDate)
              const config = statusConfig[info.status]
              const isEditing = editingId === product.id

              return (
                <Card key={product.id} className={`${config.bg} border`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {isEditing ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                        ) : (
                          <>
                            <h3 className="font-semibold text-foreground text-sm">{product.name}</h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge className={`${config.badge} text-white text-xs`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {info.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(product.expiryDate)}
                              </span>
                            </div>
                            {product.locationId && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {getLocationName(product.locationId)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSave(product.id)}
                              className="text-xs h-8"
                            >
                              Kaydet
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                              className="text-xs h-8"
                            >
                              Iptal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(product)}
                              className="h-7 w-7"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleZeroStock(product.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                              title="Stok 0 yap"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

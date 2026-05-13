"use client"

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BottomNav } from '@/components/bottom-nav'
import { ProductItem } from '@/components/product-item'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { useProductStore, getExpiryInfoByType } from '@/hooks/use-product-store'
import { Search, Camera, Plus, X, Filter, Package } from 'lucide-react'
import type { ProductType } from '@/lib/types'

function ListeContent() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'all'
  
  const { activeProducts, addProduct, updateProduct, setStockZero, isLoading, getBrands } = useProductStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    stockCode: '',
    barcode: '',
    brand: '',
    expiryDate: '',
    productType: 'shelf' as ProductType,
  })

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(activeProducts)) return []
    
    let filtered = activeProducts

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.stockCode && p.stockCode.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
      )
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'critical') {
        filtered = filtered.filter(p => {
          const info = getExpiryInfoByType(p.expiryDate, p.productType)
          return info.status === 'expired' || info.status === 'critical' || info.status === 'remove'
        })
      } else {
        filtered = filtered.filter(p => 
          getExpiryInfoByType(p.expiryDate, p.productType).status === statusFilter
        )
      }
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => (p.productType || 'shelf') === typeFilter)
    }

    return filtered.sort((a, b) => {
      const aInfo = getExpiryInfoByType(a.expiryDate, a.productType)
      const bInfo = getExpiryInfoByType(b.expiryDate, b.productType)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [activeProducts, searchQuery, statusFilter, typeFilter])

  const handleScan = (barcode: string) => {
    setSearchQuery(barcode)
    setShowScanner(false)
  }

  const handleEdit = (product: typeof activeProducts[0]) => {
    setEditingProduct(product.id)
    setFormData({
      name: product.name,
      stockCode: product.stockCode || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      expiryDate: product.expiryDate,
      productType: product.productType || 'shelf',
    })
    setShowEditModal(true)
  }

  const handleUpdateProduct = () => {
    if (!editingProduct || !formData.name || !formData.expiryDate) return

    updateProduct(editingProduct, {
      name: formData.name,
      stockCode: formData.stockCode || undefined,
      barcode: formData.barcode || undefined,
      brand: formData.brand || undefined,
      expiryDate: formData.expiryDate,
      productType: formData.productType,
    })

    setShowEditModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      stockCode: '',
      barcode: '',
      brand: '',
      expiryDate: '',
      productType: 'shelf',
    })
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      setStockZero(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleAddProduct = () => {
    if (!formData.name || !formData.expiryDate) return

    addProduct({
      name: formData.name,
      stockCode: formData.stockCode || undefined,
      barcode: formData.barcode || undefined,
      brand: formData.brand || undefined,
      expiryDate: formData.expiryDate,
      productType: formData.productType,
    })

    setFormData({
      name: '',
      stockCode: '',
      barcode: '',
      brand: '',
      expiryDate: '',
      productType: 'shelf',
    })
    setShowAddModal(false)
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
            <h1 className="text-lg font-bold text-foreground">Urunler</h1>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ekle
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ara (isim, stok kodu, barkod)"
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
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowScanner(true)}
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button 
              variant={showFilters ? "secondary" : "outline"}
              size="icon" 
              className="h-9 w-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tum Durumlar</SelectItem>
                  <SelectItem value="critical">Acil + Kaldirilacak</SelectItem>
                  <SelectItem value="campaign">Kampanya</SelectItem>
                  <SelectItem value="safe">Guvenli</SelectItem>
                </SelectContent>
              </Select>

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
            </div>
          )}
        </div>
      </header>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{filteredProducts.length} urun</span>
          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setTypeFilter('all')
              }}
              className="text-primary text-xs"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductItem
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showLink={false}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Urun bulunamadi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Arama kriterlerini degistirin' : 'Yeni urun ekleyin'}
            </p>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Stok Sifirla?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu urunun stoku sifirlanacak.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                  Iptal
                </Button>
                <Button variant="destructive" onClick={confirmDelete} className="flex-1">
                  Sifirla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <Card>
              <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Urunu Duzenle</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Urun Adi *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-9 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stok Kodu</Label>
                    <Input
                      value={formData.stockCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockCode: e.target.value }))}
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Barkod</Label>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="h-9 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Marka</Label>
                  <Select 
                    value={formData.brand} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Marka Sec" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBrands().map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yeni marka eklemek icin Ayarlar&apos;a gidin
                  </p>
                </div>

                <div>
                  <Label className="text-xs">SKT *</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="h-9 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Urun Tipi</Label>
                  <Select 
                    value={formData.productType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value as ProductType }))}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shelf">Normal Raf (14 gun)</SelectItem>
                      <SelectItem value="freezer-18">-18C Dolap (14 gun)</SelectItem>
                      <SelectItem value="fridge-4">+4C Dolap (3 gun)</SelectItem>
                      <SelectItem value="processed">Islenmis (5-10 gun)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                    Iptal
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleUpdateProduct}
                    disabled={!formData.name || !formData.expiryDate}
                  >
                    Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Yeni Urun</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Urun Adi *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ornek: Sutas Yogurt"
                    className="h-9 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Stok Kodu</Label>
                    <Input
                      value={formData.stockCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockCode: e.target.value }))}
                      placeholder="123456"
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Barkod</Label>
                    <Input
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      placeholder="8690..."
                      className="h-9 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Marka</Label>
                  <Select 
                    value={formData.brand} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Marka Sec" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBrands().map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Yeni marka eklemek icin Ayarlar&apos;a gidin
                  </p>
                </div>

                <div>
                  <Label className="text-xs">SKT *</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="h-9 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Urun Tipi</Label>
                  <Select 
                    value={formData.productType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value as ProductType }))}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shelf">Normal Raf (14 gun)</SelectItem>
                      <SelectItem value="freezer-18">-18C Dolap (14 gun)</SelectItem>
                      <SelectItem value="fridge-4">+4C Dolap (3 gun)</SelectItem>
                      <SelectItem value="processed">Islenmis (5-10 gun)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                    Iptal
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleAddProduct}
                    disabled={!formData.name || !formData.expiryDate}
                  >
                    Ekle
                  </Button>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}

export default function ListePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ListeContent />
    </Suspense>
  )
}

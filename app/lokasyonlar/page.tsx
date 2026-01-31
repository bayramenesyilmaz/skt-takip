"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { ProductCard } from '@/components/product-card'
import { DeleteDialog } from '@/components/delete-dialog'
import { useProductStore, getExpiryInfo } from '@/hooks/use-product-store'
import { 
  MapPin, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Package,
  X,
  Layers,
  ArrowLeft
} from 'lucide-react'
import type { Product, Location } from '@/lib/types'

export default function LokasyonlarPage() {
  const { 
    products, 
    locations, 
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addLocation, 
    deleteLocation,
    getProductsByLocation
  } = useProductStore()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddPaletForm, setShowAddPaletForm] = useState<string | null>(null) // parent location id
  const [showAddProductForm, setShowAddProductForm] = useState<string | null>(null) // palet id
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null)
  const [expandedPaletId, setExpandedPaletId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<Location | null>(null)
  
  const [newLocationName, setNewLocationName] = useState('')
  const [newPaletName, setNewPaletName] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [newProductDate, setNewProductDate] = useState('')

  // Ana lokasyonlar (parentId olmayan)
  const mainLocations = locations.filter(l => !l.parentId)
  
  // Bir lokasyonun paletleri
  const getPalets = (locationId: string) => locations.filter(l => l.parentId === locationId)

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim()) return
    
    addLocation({
      name: newLocationName.trim(),
      type: 'reyon'
    })
    
    setNewLocationName('')
    setShowAddForm(false)
  }

  const handleAddPalet = (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!newPaletName.trim()) return
    
    addLocation({
      name: newPaletName.trim(),
      type: 'palet',
      parentId
    })
    
    setNewPaletName('')
    setShowAddPaletForm(null)
  }

  const handleAddProduct = (e: React.FormEvent, paletId: string) => {
    e.preventDefault()
    if (!newProductName.trim() || !newProductDate) return
    
    addProduct({
      name: newProductName.trim(),
      expiryDate: newProductDate,
      locationId: paletId
    })
    
    setNewProductName('')
    setNewProductDate('')
    setShowAddProductForm(null)
  }

  const handleUpdateProduct = (product: Product) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: product.name,
        expiryDate: product.expiryDate,
        stockCode: product.stockCode,
        barcode: product.barcode
      })
      setEditingProduct(null)
    }
  }

  const handleDeleteProduct = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleDeleteLocation = () => {
    if (deleteLocationTarget) {
      // Eger ana lokasyonsa, altindaki paletleri de sil
      const palets = getPalets(deleteLocationTarget.id)
      palets.forEach(palet => deleteLocation(palet.id))
      deleteLocation(deleteLocationTarget.id)
      setDeleteLocationTarget(null)
    }
  }

  const getLocationStats = (locationId: string) => {
    // Direkt bu lokasyondaki urunler
    let locationProducts = getProductsByLocation(locationId)
    
    // Eger ana lokasyonsa, paletlerdeki urunleri de say
    const palets = getPalets(locationId)
    palets.forEach(palet => {
      locationProducts = [...locationProducts, ...getProductsByLocation(palet.id)]
    })
    
    const urgent = locationProducts.filter(p => {
      const info = getExpiryInfo(p.expiryDate)
      return info.status === 'expired' || info.status === 'critical'
    }).length
    
    return { total: locationProducts.length, urgent }
  }

  const getPaletStats = (paletId: string) => {
    const paletProducts = getProductsByLocation(paletId)
    const urgent = paletProducts.filter(p => {
      const info = getExpiryInfo(p.expiryDate)
      return info.status === 'expired' || info.status === 'critical'
    }).length
    return { total: paletProducts.length, urgent }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Lokasyonlar</h1>
                <p className="text-xs text-muted-foreground">Reyon ve Paletler</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(true)}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              Yeni Alan
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Add Location Form */}
        {showAddForm && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleAddLocation} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Yeni Lokasyon Olustur</h3>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs">Alan Adi</Label>
                  <Input
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="orn: Yag Reyonu, Kahvalti Dolabi, Soguk Depo"
                    className="h-10"
                    autoFocus
                  />
                </div>
                
                <Button type="submit" className="w-full h-10" disabled={!newLocationName.trim()}>
                  Olustur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        {mainLocations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Henuz Alan Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reyon, dolap veya depo olusturarak baslayabilirsiniz
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Alan Olustur
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {mainLocations.map((location) => {
              const stats = getLocationStats(location.id)
              const isExpanded = expandedLocationId === location.id
              const palets = getPalets(location.id)
              
              return (
                <Card key={location.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Location Header */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedLocationId(isExpanded ? null : location.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <span className="font-medium text-sm">{location.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {palets.length} palet, {stats.total} urun
                            </span>
                            {stats.urgent > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                {stats.urgent} acil
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAddPaletForm(location.id)
                            setExpandedLocationId(location.id)
                          }}
                          title="Palet Ekle"
                        >
                          <Layers className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteLocationTarget(location)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Palets */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                        {/* Add Palet Form */}
                        {showAddPaletForm === location.id && (
                          <Card className="border-dashed">
                            <CardContent className="p-3">
                              <form onSubmit={(e) => handleAddPalet(e, location.id)} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Yeni Palet</span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => setShowAddPaletForm(null)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    value={newPaletName}
                                    onChange={(e) => setNewPaletName(e.target.value)}
                                    placeholder="orn: P1, Soldaki Raf"
                                    className="h-9 flex-1"
                                    autoFocus
                                  />
                                  <Button type="submit" size="sm" className="h-9" disabled={!newPaletName.trim()}>
                                    Ekle
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        )}

                        {palets.length === 0 && showAddPaletForm !== location.id ? (
                          <div className="text-center py-4">
                            <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Bu alanda palet yok</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 h-8"
                              onClick={() => setShowAddPaletForm(location.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Palet Ekle
                            </Button>
                          </div>
                        ) : (
                          palets.map(palet => {
                            const paletStats = getPaletStats(palet.id)
                            const isPaletExpanded = expandedPaletId === palet.id
                            const paletProducts = getProductsByLocation(palet.id)
                            
                            return (
                              <Card key={palet.id} className="bg-background">
                                <CardContent className="p-0">
                                  {/* Palet Header */}
                                  <div 
                                    className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/50"
                                    onClick={() => setExpandedPaletId(isPaletExpanded ? null : palet.id)}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isPaletExpanded ? (
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                      )}
                                      <Layers className="w-4 h-4 text-primary/70" />
                                      <div>
                                        <span className="text-sm font-medium">{palet.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            {paletStats.total} urun
                                          </span>
                                          {paletStats.urgent > 0 && (
                                            <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                                              {paletStats.urgent}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowAddProductForm(palet.id)
                                          setExpandedPaletId(palet.id)
                                        }}
                                        title="Urun Ekle"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setDeleteLocationTarget(palet)
                                        }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Palet Products */}
                                  {isPaletExpanded && (
                                    <div className="border-t border-border bg-muted/20 p-2.5 space-y-2">
                                      {/* Add Product Form */}
                                      {showAddProductForm === palet.id && (
                                        <Card className="border-dashed">
                                          <CardContent className="p-2.5">
                                            <form onSubmit={(e) => handleAddProduct(e, palet.id)} className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">Hizli Urun Ekle</span>
                                                <Button 
                                                  type="button" 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-6 w-6"
                                                  onClick={() => setShowAddProductForm(null)}
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <Input
                                                value={newProductName}
                                                onChange={(e) => setNewProductName(e.target.value)}
                                                placeholder="Urun adi"
                                                className="h-9"
                                                autoFocus
                                              />
                                              <div className="flex gap-2">
                                                <Input
                                                  type="date"
                                                  value={newProductDate}
                                                  onChange={(e) => setNewProductDate(e.target.value)}
                                                  className="h-9 flex-1"
                                                />
                                                <Button 
                                                  type="submit" 
                                                  size="sm" 
                                                  className="h-9"
                                                  disabled={!newProductName.trim() || !newProductDate}
                                                >
                                                  Ekle
                                                </Button>
                                              </div>
                                            </form>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {paletProducts.length === 0 && showAddProductForm !== palet.id ? (
                                        <div className="text-center py-3">
                                          <Package className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1" />
                                          <p className="text-xs text-muted-foreground">Urun yok</p>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="mt-2 h-7 text-xs"
                                            onClick={() => setShowAddProductForm(palet.id)}
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Urun Ekle
                                          </Button>
                                        </div>
                                      ) : (
                                        paletProducts
                                          .sort((a, b) => getExpiryInfo(a.expiryDate).daysLeft - getExpiryInfo(b.expiryDate).daysLeft)
                                          .map(product => (
                                            <ProductCard
                                              key={product.id}
                                              product={product}
                                              onEdit={setEditingProduct}
                                              onDelete={(id) => {
                                                const p = products.find(p => p.id === id)
                                                if (p) setDeleteTarget(p)
                                              }}
                                              compact
                                            />
                                          ))
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })
                        )}
                        
                        {palets.length > 0 && showAddPaletForm !== location.id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 text-xs"
                            onClick={() => setShowAddPaletForm(location.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Palet Ekle
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />

      {/* Delete Product Dialog */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        productName={deleteTarget?.name || ''}
      />

      {/* Delete Location Dialog */}
      <DeleteDialog
        open={!!deleteLocationTarget}
        onOpenChange={(open) => !open && setDeleteLocationTarget(null)}
        onConfirm={handleDeleteLocation}
        productName={`${deleteLocationTarget?.name || ''}`}
      />
    </main>
  )
}

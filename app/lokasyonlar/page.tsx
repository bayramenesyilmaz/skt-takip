"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { BottomNav } from '@/components/bottom-nav'
import { ProductForm } from '@/components/product-form'
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
  X
} from 'lucide-react'
import type { Product, Location } from '@/lib/types'

const locationTypes = [
  { value: 'reyon', label: 'Reyon' },
  { value: 'palet', label: 'Palet' },
  { value: 'depo', label: 'Depo' },
  { value: 'dolap', label: 'Dolap' },
  { value: 'raf', label: 'Raf' },
] as const

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
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<Location | null>(null)
  
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'reyon' as Location['type']
  })

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocation.name.trim()) return
    
    addLocation({
      name: newLocation.name.trim(),
      type: newLocation.type
    })
    
    setNewLocation({ name: '', type: 'reyon' })
    setShowAddForm(false)
  }

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedLocation) {
      addProduct({ ...product, locationId: selectedLocation.id })
    } else {
      addProduct(product)
    }
    setShowProductForm(false)
    setSelectedLocation(null)
  }

  const handleUpdateProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, product)
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
      deleteLocation(deleteLocationTarget.id)
      setDeleteLocationTarget(null)
    }
  }

  const getLocationStats = (locationId: string) => {
    const locationProducts = getProductsByLocation(locationId)
    const urgent = locationProducts.filter(p => {
      const info = getExpiryInfo(p.expiryDate)
      return info.status === 'expired' || info.status === 'critical'
    }).length
    return { total: locationProducts.length, urgent }
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

  if (showProductForm || editingProduct) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto p-4">
          <ProductForm
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            onCancel={() => {
              setShowProductForm(false)
              setSelectedLocation(null)
              setEditingProduct(null)
            }}
            initialData={editingProduct || undefined}
            locations={locations}
          />
        </div>
      </main>
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
                <p className="text-xs text-muted-foreground">Reyon, Palet, Depo</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(true)}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ekle
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
                  <h3 className="font-medium text-sm">Yeni Lokasyon</h3>
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lokasyon Adi</Label>
                    <Input
                      value={newLocation.name}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="orn: Yag Reyonu"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tip</Label>
                    <Select 
                      value={newLocation.type}
                      onValueChange={(v) => setNewLocation(prev => ({ ...prev, type: v as Location['type'] }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-10" disabled={!newLocation.name.trim()}>
                  Lokasyon Ekle
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Lokasyon Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reyon, palet veya depo ekleyerek baslayin
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Lokasyon Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => {
              const stats = getLocationStats(location.id)
              const isExpanded = expandedId === location.id
              const locationProducts = getProductsByLocation(location.id)
              
              return (
                <Card key={location.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Location Header */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(isExpanded ? null : location.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{location.name}</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {locationTypes.find(t => t.value === location.type)?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {stats.total} urun
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
                            setSelectedLocation(location)
                            setShowProductForm(true)
                          }}
                        >
                          <Plus className="w-4 h-4" />
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
                    
                    {/* Expanded Products */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                        {locationProducts.length === 0 ? (
                          <div className="text-center py-4">
                            <Package className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Bu lokasyonda urun yok</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 h-8"
                              onClick={() => {
                                setSelectedLocation(location)
                                setShowProductForm(true)
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Urun Ekle
                            </Button>
                          </div>
                        ) : (
                          locationProducts
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
            })}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowProductForm(true)} />

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
        productName={`${deleteLocationTarget?.name || ''} lokasyonu`}
      />
    </main>
  )
}

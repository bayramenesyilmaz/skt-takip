"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Camera, Package, Hash, Barcode, Calendar, X, MapPin } from 'lucide-react'
import type { Product, Location } from '@/lib/types'

interface ProductFormProps {
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  initialData?: Product
  locations?: Location[]
}

export function ProductForm({ onSubmit, onCancel, initialData, locations = [] }: ProductFormProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    stockCode: initialData?.stockCode || '',
    barcode: initialData?.barcode || '',
    expiryDate: initialData?.expiryDate || '',
    locationId: initialData?.locationId || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.expiryDate) {
      return
    }
    onSubmit({
      name: formData.name,
      stockCode: formData.stockCode || undefined,
      barcode: formData.barcode || undefined,
      expiryDate: formData.expiryDate,
      locationId: formData.locationId || undefined,
    })
  }

  const handleScan = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    setShowScanner(false)
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value
    
    if (field === 'stockCode') {
      value = value.replace(/\D/g, '').slice(0, 6)
    }
    
    if (field === 'barcode') {
      value = value.replace(/\D/g, '')
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (showScanner) {
    return <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {initialData ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Urun Adi *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="orn: Lezita Doner Pilic 300gr"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Son Kullanma Tarihi *
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange('expiryDate')}
              className="h-11"
              required
            />
          </div>

          {locations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Lokasyon
              </Label>
              <Select 
                value={formData.locationId || "none"} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Lokasyon sec (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Lokasyon yok</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stockCode" className="text-sm font-medium flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                Stok Kodu
              </Label>
              <Input
                id="stockCode"
                value={formData.stockCode}
                onChange={handleChange('stockCode')}
                placeholder="123456"
                className="h-11"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm font-medium flex items-center gap-2">
                <Barcode className="w-4 h-4 text-muted-foreground" />
                Barkod
              </Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={handleChange('barcode')}
                  placeholder="8690..."
                  className="h-11 flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-3"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
            >
              Iptal
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11"
            >
              {initialData ? 'Guncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

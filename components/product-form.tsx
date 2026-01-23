"use client"

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Camera, Package, Hash, Barcode, Calendar, X } from 'lucide-react'
import type { Product } from '@/lib/types'

interface ProductFormProps {
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  initialData?: Product
}

export function ProductForm({ onSubmit, onCancel, initialData }: ProductFormProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    stockCode: initialData?.stockCode || '',
    barcode: initialData?.barcode || '',
    expiryDate: initialData?.expiryDate || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.stockCode || !formData.expiryDate) {
      return
    }
    onSubmit(formData)
  }

  const handleScan = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    setShowScanner(false)
  }

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value
    
    // Stock code: only 6 digits
    if (field === 'stockCode') {
      value = value.replace(/\D/g, '').slice(0, 6)
    }
    
    // Barcode: only digits
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
            {initialData ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Ürün Adı
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange('name')}
              placeholder="örn: Lezita Döner Piliç 300gr"
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockCode" className="text-sm font-medium flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Stok Kodu (6 Haneli)
            </Label>
            <Input
              id="stockCode"
              value={formData.stockCode}
              onChange={handleChange('stockCode')}
              placeholder="örn: 123456"
              className="h-12"
              maxLength={6}
              pattern="\d{6}"
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.stockCode.length}/6 karakter
            </p>
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
                placeholder="örn: 8690000000000"
                className="h-12 flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                className="h-12 px-4"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Son Kullanma Tarihi
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange('expiryDate')}
              className="h-12"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-transparent"
              onClick={onCancel}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12"
            >
              {initialData ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

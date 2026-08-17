"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarcodeScanner } from '@/components/barcode-scanner'
import { Camera, Package, Hash, Barcode, Calendar, X, Tag, Thermometer } from 'lucide-react'
import type { Product, Brand, ShelfLifeType } from '@/lib/types'

interface ProductFormProps {
  onSubmit: (product: Partial<Product> & { expiryDate?: string }) => void
  onCancel: () => void
  initialData?: Product
  initialBarcode?: string
  brands?: Brand[]
  shelfLifeTypes?: ShelfLifeType[]
}

export function ProductForm({ onSubmit, onCancel, initialData, initialBarcode, brands = [], shelfLifeTypes = [] }: ProductFormProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    stock_code: initialData?.stock_code || '',
    barcode: initialData?.barcode || initialBarcode || '',
    expiryDate: '',
    brand_id: initialData?.brand_id || '',
    shelf_life_type_id: initialData?.shelf_life_type_id || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return
    onSubmit({
      name: formData.name,
      stock_code: formData.stock_code || undefined,
      barcode: formData.barcode || undefined,
      brand_id: formData.brand_id || undefined,
      shelf_life_type_id: formData.shelf_life_type_id || undefined,
      expiryDate: formData.expiryDate || undefined,
    })
  }

  if (showScanner) return <BarcodeScanner onScan={(b) => { setFormData((p) => ({ ...p, barcode: b })); setShowScanner(false) }} onClose={() => setShowScanner(false)} />

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />{initialData ? 'Urunu Duzenle' : 'Yeni Urun Ekle'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="w-5 h-5" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name" className="text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" />Urun Adi *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="orn: Lezita Doner Pilic 300gr" className="h-11" required /></div>
          {!initialData && <div className="space-y-2"><Label htmlFor="expiryDate" className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />Son Kullanma Tarihi</Label><Input id="expiryDate" type="date" value={formData.expiryDate} onChange={(e) => setFormData((p) => ({ ...p, expiryDate: e.target.value }))} className="h-11" /></div>}
          {brands.length > 0 && (
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" />Marka</Label>
              <Select value={formData.brand_id || 'none'} onValueChange={(v) => setFormData((p) => ({ ...p, brand_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Marka sec (opsiyonel)" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Marka yok</SelectItem>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}{!b.return_accepts ? ' (iade almaz)' : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {shelfLifeTypes.length > 0 && (
            <div className="space-y-2"><Label className="text-sm font-medium flex items-center gap-2"><Thermometer className="w-4 h-4 text-muted-foreground" />Raf Omru Tipi</Label>
              <Select value={formData.shelf_life_type_id || 'none'} onValueChange={(v) => setFormData((p) => ({ ...p, shelf_life_type_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Kategori sec (opsiyonel)" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Kategori yok</SelectItem>{shelfLifeTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="stock_code" className="text-sm font-medium flex items-center gap-2"><Hash className="w-4 h-4 text-muted-foreground" />Stok Kodu</Label><Input id="stock_code" value={formData.stock_code} onChange={(e) => setFormData((p) => ({ ...p, stock_code: e.target.value }))} placeholder="123456" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="barcode" className="text-sm font-medium flex items-center gap-2"><Barcode className="w-4 h-4 text-muted-foreground" />Barkod</Label><div className="flex gap-2"><Input id="barcode" value={formData.barcode} onChange={(e) => setFormData((p) => ({ ...p, barcode: e.target.value }))} placeholder="8690..." className="h-11 flex-1" /><Button type="button" variant="secondary" className="h-11 px-3" onClick={() => setShowScanner(true)}><Camera className="w-5 h-5" /></Button></div></div>
          </div>
          <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1 h-11" onClick={onCancel}>Iptal</Button><Button type="submit" className="flex-1 h-11">{initialData ? 'Guncelle' : 'Ekle'}</Button></div>
        </form>
      </CardContent>
    </Card>
  )
}

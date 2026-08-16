'use client'

import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Tag, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'

export default function BrandsPage() {
  const { brands, products, addBrand, updateBrand, deleteBrand } = useAppData()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [newBrandName, setNewBrandName] = useState('')

  const productCount = useMemo(() => {
    const m: Record<string, number> = {}
    products.forEach((p) => {
      if (p.brand_id) m[p.brand_id] = (m[p.brand_id] || 0) + 1
    })
    return m
  }, [products])

  const handleAdd = async () => {
    if (!newBrandName.trim()) return
    await addBrand({ name: newBrandName.trim(), return_accepts: true })
    setNewBrandName('')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-semibold text-lg">Markalar</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <Card className="p-4 space-y-2">
          <Label>Yeni Marka Ekle</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Marka adi"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
            />
            <Button onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
          </div>
        </Card>

        {brands.map((brand) => (
          <Card key={brand.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <div>
                <p className="font-medium text-sm">{brand.name}</p>
                <Badge variant="outline">{productCount[brand.id] || 0} urun</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateBrand(brand.id, { return_accepts: !brand.return_accepts })}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {brand.return_accepts ? 'Iade Alir' : 'Iade Almaz'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteBrand(brand.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}

        {brands.length === 0 && (
          <Card className="p-4 text-center text-sm text-gray-500">
            Marka yok.
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

'use client'

import { useAppData } from '@/hooks/use-app-data'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/app/ayarlar"><Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Markalar</h1>
              <p className="text-xs text-muted-foreground">Iade durumunu marka bazinda yonetin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{brands.length}</Badge>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Yeni marka adi..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="h-10 flex-1 bg-muted/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button className="h-10" disabled={!newBrandName.trim()} onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Ekle</Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Marka Yok</h3>
            <p className="text-sm text-muted-foreground">Yukaridan yeni bir marka ekleyin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <Card key={brand.id}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Tag className="w-4 h-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{brand.name}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">{productCount[brand.id] || 0} urun</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateBrand(brand.id, { return_accepts: !brand.return_accepts })}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      {brand.return_accepts ? 'Iade Alir' : 'Iade Almaz'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => deleteBrand(brand.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

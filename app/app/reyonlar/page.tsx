'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useReyon } from '@/lib/context/reyon-context'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, MapPin, Search, Check } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'

export default function ReyonlarPage() {
  const { reyons, products, addReyon, deleteReyon } = useAppData()
  const { currentReyonId, setCurrentReyonId } = useReyon()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [newReyonName, setNewReyonName] = useState('')
  const [search, setSearch] = useState('')

  const productCount = useMemo(() => {
    const m: Record<string, number> = {}
    products.forEach((p) => {
      if (p.reyon_id) m[p.reyon_id] = (m[p.reyon_id] || 0) + 1
    })
    return m
  }, [products])

  const filteredReyons = useMemo(() => {
    if (!search.trim()) return reyons
    const q = search.toLowerCase()
    return reyons.filter((r) => r.name.toLowerCase().includes(q))
  }, [reyons, search])

  const handleAdd = async () => {
    if (!newReyonName.trim()) return
    const created = await addReyon({ name: newReyonName.trim() })
    if (!currentReyonId) setCurrentReyonId(created.id)
    setNewReyonName('')
  }

  const handleDelete = async (id: string) => {
    await deleteReyon(id)
    if (currentReyonId === id) setCurrentReyonId(null)
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
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Reyonlar</h1>
              <p className="text-xs text-muted-foreground">Mevcut reyonunuzu secin, yeni reyon ekleyin</p>
            </div>
            <Badge variant="secondary" className="text-xs">{reyons.length}</Badge>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Yeni reyon adi..."
              value={newReyonName}
              onChange={(e) => setNewReyonName(e.target.value)}
              className="h-10 flex-1 bg-muted/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button className="h-10" disabled={!newReyonName.trim()} onClick={handleAdd}><Plus className="w-4 h-4 mr-1" />Ekle</Button>
          </div>

          {reyons.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Reyon ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/50"
              />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {reyons.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Reyon Yok</h3>
            <p className="text-sm text-muted-foreground">Yukaridan yeni bir reyon ekleyin.</p>
          </div>
        ) : filteredReyons.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Reyon Bulunamadi</h3>
            <p className="text-sm text-muted-foreground">Aramanla eslesen reyon yok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReyons.map((reyon) => {
              const isCurrent = currentReyonId === reyon.id
              return (
                <Card key={reyon.id} className={isCurrent ? 'border-primary' : undefined}>
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      onClick={() => setCurrentReyonId(reyon.id)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-primary" /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate flex items-center gap-1">
                          {reyon.name}
                          {isCurrent && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </p>
                        <Badge variant="outline" className="text-xs mt-0.5">{productCount[reyon.id] || 0} urun</Badge>
                      </div>
                    </button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(reyon.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}

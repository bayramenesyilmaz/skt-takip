'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronDown, ChevronRight, Trash2, MapPin, Layers, Package, X } from 'lucide-react'
import Link from 'next/link'
import { getExpiryInfo, statusConfig } from '@/lib/expiry'
import type { Location, ProductWithStock } from '@/lib/types'

export default function LokasyonlarPage() {
  const { profile } = useAuth()
  const storageMode = getStorageMode()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const canDelete = profile?.role === 'super_admin' || profile?.role === 'owner' || profile?.role === 'branch_manager' || storageMode === 'local'
  const { products, locations, addLocation, deleteLocation, addProduct } = useAppData()

  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddPalet, setShowAddPalet] = useState<string | null>(null)
  const [showAddProduct, setShowAddProduct] = useState<string | null>(null)
  const [expandedLoc, setExpandedLoc] = useState<string | null>(null)
  const [expandedPalet, setExpandedPalet] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [newLocName, setNewLocName] = useState('')
  const [newPaletName, setNewPaletName] = useState('')
  const [newPaletLevel, setNewPaletLevel] = useState(1)
  const [newProductName, setNewProductName] = useState('')
  const [newProductDate, setNewProductDate] = useState('')

  const mainLocations = locations.filter(l => !l.parent_id)
  const getPalets = (locId: string) => locations.filter(l => l.parent_id === locId)

  const getLocProductCount = (locId: string) => {
    const palets = getPalets(locId)
    let count = 0
    for (const p of products) {
      for (const s of p.stock_items || []) {
        if (s.location_id === locId || palets.some(palet => palet.id === s.location_id)) { count++; break }
      }
    }
    return count
  }

  const getLocUrgentCount = (locId: string) => {
    const palets = getPalets(locId)
    let urgent = 0
    for (const p of products) {
      for (const s of p.stock_items || []) {
        if (s.location_id === locId || palets.some(palet => palet.id === s.location_id)) {
          const info = getExpiryInfo(s.expiry_date)
          if (info.status === 'expired' || info.status === 'critical') urgent++
          break
        }
      }
    }
    return urgent
  }

  const getPaletProducts = (paletId: string) => {
    return products.filter(p => p.stock_items?.some(s => s.location_id === paletId))
  }

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocName.trim()) return
    addLocation({ name: newLocName.trim(), type: 'reyon' } as any)
    setNewLocName('')
    setShowAddForm(false)
  }

  const handleAddPalet = (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!newPaletName.trim()) return
    addLocation({ name: newPaletName.trim(), type: 'palet', parent_id: parentId, level: newPaletLevel } as any)
    setNewPaletName('')
    setNewPaletLevel(1)
    setShowAddPalet(null)
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProductName.trim() || !newProductDate) return
    addProduct({ name: newProductName.trim(), expiryDate: newProductDate } as any)
    setNewProductName('')
    setNewProductDate('')
    setShowAddProduct(null)
  }

  const handleDeleteLoc = () => {
    if (!deleteTarget) return
    const palets = getPalets(deleteTarget.id)
    palets.forEach(p => deleteLocation(p.id))
    deleteLocation(deleteTarget.id)
    setDeleteTarget(null)
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
            <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9">
              <Plus className="w-4 h-4 mr-1" />Yeni Alan
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {showAddForm && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleAddLoc} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Yeni Lokasyon Olustur</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alan Adi</Label>
                  <Input value={newLocName} onChange={(e) => setNewLocName(e.target.value)}
                    placeholder="orn: Yag Reyonu, Baharat, Soguk Depo" className="h-10" autoFocus />
                </div>
                <Button type="submit" className="w-full h-10" disabled={!newLocName.trim()}>Olustur</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {mainLocations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Henuz Alan Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">Reyon, dolap veya depo olusturarak baslayabilirsiniz</p>
            <Button onClick={() => setShowAddForm(true)}><Plus className="w-4 h-4 mr-2" />Yeni Alan Olustur</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {mainLocations.map((loc) => {
              const isExp = expandedLoc === loc.id
              const palets = getPalets(loc.id)
              const prodCount = getLocProductCount(loc.id)
              const urgentCount = getLocUrgentCount(loc.id)

              return (
                <Card key={loc.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedLoc(isExp ? null : loc.id)}>
                      <div className="flex items-center gap-3">
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <span className="font-medium text-sm">{loc.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{palets.length} palet, {prodCount} urun</span>
                            {urgentCount > 0 && <Badge variant="destructive" className="text-xs px-1.5 py-0">{urgentCount} acil</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); setShowAddPalet(loc.id); setExpandedLoc(loc.id) }} title="Palet Ekle">
                          <Layers className="w-4 h-4" />
                        </Button>
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(loc) }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {isExp && (
                      <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                        {showAddPalet === loc.id && (
                          <Card className="border-dashed">
                            <CardContent className="p-3">
                              <form onSubmit={(e) => handleAddPalet(e, loc.id)} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Yeni Palet</span>
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddPalet(null)}>
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <Input value={newPaletName} onChange={(e) => setNewPaletName(e.target.value)}
                                    placeholder="orn: P1, Soldaki Raf" className="h-9 flex-1" autoFocus />
                                  <select value={newPaletLevel} onChange={(e) => setNewPaletLevel(Number(e.target.value))}
                                    className="h-9 px-2 border rounded-md text-sm bg-background">
                                    <option value={1}>Kat 1</option>
                                    <option value={2}>Kat 2</option>
                                    <option value={3}>Kat 3</option>
                                  </select>
                                  <Button type="submit" size="sm" className="h-9" disabled={!newPaletName.trim()}>Ekle</Button>
                                </div>
                              </form>
                            </CardContent>
                          </Card>
                        )}

                        {palets.length === 0 && showAddPalet !== loc.id ? (
                          <div className="text-center py-4">
                            <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Bu alanda palet yok</p>
                            <Button variant="outline" size="sm" className="mt-2 h-8" onClick={() => setShowAddPalet(loc.id)}>
                              <Plus className="w-3 h-3 mr-1" />Palet Ekle
                            </Button>
                          </div>
                        ) : (
                          palets.map(palet => {
                            const isPaletExp = expandedPalet === palet.id
                            const paletProducts = getPaletProducts(palet.id)
                            return (
                              <Card key={palet.id} className="bg-background">
                                <CardContent className="p-0">
                                  <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/50"
                                    onClick={() => setExpandedPalet(isPaletExp ? null : palet.id)}>
                                    <div className="flex items-center gap-2">
                                      {isPaletExp ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                      <Layers className="w-4 h-4 text-primary/70" />
                                      <div>
                                        <span className="text-sm font-medium">{palet.name}</span>
                                        <span className="text-xs text-muted-foreground ml-1">Kat {palet.level}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">{paletProducts.length} urun</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={(e) => { e.stopPropagation(); setShowAddProduct(palet.id); setExpandedPalet(palet.id) }} title="Urun Ekle">
                                        <Plus className="w-3.5 h-3.5" />
                                      </Button>
                                      {canDelete && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(palet) }}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {isPaletExp && (
                                    <div className="border-t border-border bg-muted/20 p-2.5 space-y-2">
                                      {showAddProduct === palet.id && (
                                        <Card className="border-dashed">
                                          <CardContent className="p-2.5">
                                            <form onSubmit={handleAddProduct} className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">Hizli Urun Ekle</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddProduct(null)}>
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                              <Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)}
                                                placeholder="Urun adi" className="h-9" autoFocus />
                                              <div className="flex gap-2">
                                                <Input type="date" value={newProductDate} onChange={(e) => setNewProductDate(e.target.value)} className="h-9 flex-1" />
                                                <Button type="submit" size="sm" className="h-9" disabled={!newProductName.trim() || !newProductDate}>Ekle</Button>
                                              </div>
                                            </form>
                                          </CardContent>
                                        </Card>
                                      )}

                                      {paletProducts.length === 0 && showAddProduct !== palet.id ? (
                                        <div className="text-center py-3">
                                          <Package className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1" />
                                          <p className="text-xs text-muted-foreground">Urun yok</p>
                                          <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setShowAddProduct(palet.id)}>
                                            <Plus className="w-3 h-3 mr-1" />Urun Ekle
                                          </Button>
                                        </div>
                                      ) : (
                                        paletProducts
                                          .sort((a, b) => {
                                            const aDate = a.stock_items?.[0]?.expiry_date || '9999'
                                            const bDate = b.stock_items?.[0]?.expiry_date || '9999'
                                            return new Date(aDate).getTime() - new Date(bDate).getTime()
                                          })
                                          .map(product => {
                                            const info = getExpiryInfo(product.stock_items?.[0]?.expiry_date || '9999')
                                            const config = statusConfig[info.status]
                                            return (
                                              <Link key={product.id} href={`/app/urun?id=${product.id}`}>
                                                <div className={`p-2.5 rounded-lg ${config.bg} border ${config.border} cursor-pointer hover:shadow-sm transition-shadow`}>
                                                  <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-sm font-medium truncate">{product.name}</p>
                                                      <p className={`text-xs ${config.text}`}>{info.label}</p>
                                                    </div>
                                                    <Badge className={`${config.badge} text-xs px-1.5 py-0`}>
                                                      {formatDateShort(product.stock_items?.[0]?.expiry_date)}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </Link>
                                            )
                                          })
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })
                        )}

                        {palets.length > 0 && showAddPalet !== loc.id && (
                          <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => setShowAddPalet(loc.id)}>
                            <Plus className="w-3 h-3 mr-1" />Palet Ekle
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6 text-center space-y-4">
              <Trash2 className="w-10 h-10 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground">Silinsin mi?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  "{deleteTarget.name}" ve altindaki tum veriler silinecek.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Iptal</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDeleteLoc}>Sil</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}

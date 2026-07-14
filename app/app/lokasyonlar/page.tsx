'use client'

import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/lib/auth/auth-context'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, MapPin, Boxes
} from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'

export default function LocationsPage() {
  const { profile } = useAuth()
  const {
    products,
    locations,
    palets,
    addLocation,
    addPalet,
    deleteLocation,
    deletePalet,
    addProduct,
  } = useAppData()

  const storageMode = getStorageMode()
  const canDelete =
    profile?.role === 'super_admin' ||
    profile?.role === 'owner' ||
    profile?.role === 'branch_manager' ||
    storageMode === 'local'

  const [newLocName, setNewLocName] = useState('')
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({})
  const [expandedPalets, setExpandedPalets] = useState<Record<string, boolean>>({})
  const [paletForms, setPaletForms] = useState<Record<string, { name: string; level: number }>>({})
  const [quickAdd, setQuickAdd] = useState<Record<string, { name: string; expiryDate: string }>>({})

  const paletsByLocation = useMemo(() => {
    const m: Record<string, any[]> = {}
    palets.forEach((p: any) => {
      if (!m[p.locationId]) m[p.locationId] = []
      m[p.locationId].push(p)
    })
    return m
  }, [palets])

  const productsByPalet = useMemo(() => {
    const m: Record<string, any[]> = {}
    products.forEach((p: any) => {
      if (p.paletId) {
        if (!m[p.paletId]) m[p.paletId] = []
        m[p.paletId].push(p)
      }
    })
    return m
  }, [products])

  const handleAddLocation = async () => {
    if (!newLocName.trim()) return
    await addLocation({ name: newLocName })
    setNewLocName('')
  }

  const handleAddPalet = async (locationId: string) => {
    const form = paletForms[locationId]
    if (!form?.name.trim()) return
    await addPalet({ name: form.name, locationId, level: form.level })
    setPaletForms({ ...paletForms, [locationId]: { name: '', level: 1 } })
  }

  const handleQuickAdd = async (paletId: string) => {
    const form = quickAdd[paletId]
    if (!form?.name.trim()) return
    await addProduct({ name: form.name, expiryDate: form.expiryDate, paletId })
    setQuickAdd({ ...quickAdd, [paletId]: { name: '', expiryDate: '' } })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-semibold text-lg">Lokasyonlar</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <Card className="p-4 space-y-2">
          <Label>Yeni Reyon Ekle</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Reyon adi"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
            />
            <Button onClick={handleAddLocation}><Plus className="w-4 h-4" /></Button>
          </div>
        </Card>

        {locations.map((loc: any) => {
          const expanded = expandedLocs[loc.id]
          const locPalets = paletsByLocation[loc.id] || []
          return (
            <Card key={loc.id} className="p-3">
              <div className="flex items-center justify-between">
                <button
                  className="flex items-center gap-2 flex-1 text-left"
                  onClick={() => setExpandedLocs({ ...expandedLocs, [loc.id]: !expanded })}
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{loc.name}</span>
                  <Badge variant="outline">{locPalets.length} palet</Badge>
                </button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLocation(loc.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              {expanded && (
                <div className="mt-3 pl-6 space-y-2">
                  {locPalets.map((palet: any) => {
                    const pExpanded = expandedPalets[palet.id]
                    const paletProducts = productsByPalet[palet.id] || []
                    return (
                      <div key={palet.id} className="border rounded p-2">
                        <div className="flex items-center justify-between">
                          <button
                            className="flex items-center gap-2 flex-1 text-left"
                            onClick={() => setExpandedPalets({ ...expandedPalets, [palet.id]: !pExpanded })}
                          >
                            {pExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <Boxes className="w-3 h-3" />
                            <span className="text-sm">{palet.name}</span>
                            <Badge variant="outline">Seviye {palet.level}</Badge>
                          </button>
                          {canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => deletePalet(palet.id)}>
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          )}
                        </div>

                        {pExpanded && (
                          <div className="mt-2 pl-6 space-y-1">
                            {paletProducts.map((p: any) => (
                              <Link key={p.id} href={`/app/urun?id=${p.id}`}>
                                <div className="text-xs p-1 hover:bg-gray-100 rounded">
                                  {p.name} - {p.expiryDate}
                                </div>
                              </Link>
                            ))}
                            <div className="flex gap-1 mt-1">
                              <Input
                                placeholder="Hizli urun ekle"
                                value={quickAdd[palet.id]?.name || ''}
                                onChange={(e) => setQuickAdd({
                                  ...quickAdd,
                                  [palet.id]: { ...quickAdd[palet.id], name: e.target.value, expiryDate: quickAdd[palet.id]?.expiryDate || '' }
                                })}
                                className="h-8 text-xs"
                              />
                              <Input
                                type="date"
                                value={quickAdd[palet.id]?.expiryDate || ''}
                                onChange={(e) => setQuickAdd({
                                  ...quickAdd,
                                  [palet.id]: { ...quickAdd[palet.id], expiryDate: e.target.value, name: quickAdd[palet.id]?.name || '' }
                                })}
                                className="h-8 text-xs w-32"
                              />
                              <Button size="sm" onClick={() => handleQuickAdd(palet.id)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="flex gap-1 items-center mt-2">
                    <Input
                      placeholder="Palet adi"
                      value={paletForms[loc.id]?.name || ''}
                      onChange={(e) => setPaletForms({
                        ...paletForms,
                        [loc.id]: { name: e.target.value, level: paletForms[loc.id]?.level || 1 }
                      })}
                      className="h-8 text-xs"
                    />
                    <Select
                      value={String(paletForms[loc.id]?.level || 1)}
                      onValueChange={(v) => setPaletForms({
                        ...paletForms,
                        [loc.id]: { name: paletForms[loc.id]?.name || '', level: Number(v) }
                      })}
                    >
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Seviye 1</SelectItem>
                        <SelectItem value="2">Seviye 2</SelectItem>
                        <SelectItem value="3">Seviye 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleAddPalet(loc.id)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

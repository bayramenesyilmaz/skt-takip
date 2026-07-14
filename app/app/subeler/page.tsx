"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { GitBranch, Plus, Trash2, X, Building2, Phone, MapPin, Users } from 'lucide-react'
import type { Branch, Profile } from '@/lib/types'

export default function SubelerPage() {
  const { profile, organization } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '' })

  useEffect(() => {
    if (!organization) return
    loadData()
  }, [organization])

  const loadData = async () => {
    if (!organization) return
    const [branchesRes, profilesRes] = await Promise.all([
      supabase.from('branches').select('*').eq('org_id', organization.id),
      supabase.from('profiles').select('*').eq('org_id', organization.id),
    ])
    if (branchesRes.data) setBranches(branchesRes.data as Branch[])
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[])
  }

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !newBranch.name.trim()) return
    await supabase.from('branches').insert({
      org_id: organization.id,
      name: newBranch.name.trim(),
      address: newBranch.address || null,
      phone: newBranch.phone || null,
    })
    setNewBranch({ name: '', address: '', phone: '' })
    setShowAddForm(false)
    loadData()
  }

  const handleDeleteBranch = async () => {
    if (!deleteTarget) return
    await supabase.from('branches').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadData()
  }

  const getBranchManager = (branchId: string) => {
    return profiles.find(p => p.branch_id === branchId && p.role === 'branch_manager')
  }

  const getBranchStaffCount = (branchId: string) => {
    return profiles.filter(p => p.branch_id === branchId).length
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Şubeler</h1>
                <p className="text-xs text-muted-foreground">{branches.length} şube</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9">
              <Plus className="w-4 h-4 mr-1" />
              Yeni Şube
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {showAddForm && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleAddBranch} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Yeni Şube Ekle</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Şube Adı *</Label>
                  <Input
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="örn: Kadıköy Şubesi"
                    className="h-10"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Adres</Label>
                  <Input
                    value={newBranch.address}
                    onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    placeholder="Adres"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefon</Label>
                  <Input
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    placeholder="Telefon"
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-10" disabled={!newBranch.name.trim()}>
                  Oluştur
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {branches.length === 0 && !showAddForm ? (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Henüz Şube Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Şube ekleyerek şube müdürleri atayabilirsiniz
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Şube Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((branch) => {
              const manager = getBranchManager(branch.id)
              const staffCount = getBranchStaffCount(branch.id)
              return (
                <Card key={branch.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{branch.name}</h3>
                          {branch.address && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">{branch.address}</span>
                            </div>
                          )}
                          {branch.phone && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{branch.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {manager ? (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                Müdür: {manager.full_name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Müdür yok</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{staffCount} personel</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(branch)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteBranch}
        productName={deleteTarget?.name || ''}
      />
    </main>
  )
}

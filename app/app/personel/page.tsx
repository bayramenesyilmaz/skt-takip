"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { DeleteDialog } from '@/components/delete-dialog'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { Users, UserPlus, Trash2, Copy, Check, Mail, Shield, User as UserIcon } from 'lucide-react'
import type { Profile, Branch, UserRole } from '@/lib/types'

export default function PersonelPage() {
  const { profile, organization } = useAuth()
  const storageMode = getStorageMode()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'staff' as UserRole,
    branch_id: '',
  })

  const canManage = profile?.role === 'super_admin' || profile?.role === 'owner'
  const isMultiBranch = organization?.type === 'multi_branch'

  useEffect(() => {
    if (storageMode === 'local' || !organization) return
    loadData()
  }, [organization, storageMode])

  const loadData = async () => {
    if (!organization) return
    const [profilesRes, branchesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('org_id', organization.id),
      supabase.from('branches').select('*').eq('org_id', organization.id),
    ])
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[])
    if (branchesRes.data) setBranches(branchesRes.data as Branch[])
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization || !newUser.email || !newUser.password || !newUser.fullName) return

    try {
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: { full_name: newUser.fullName },
      })

      if (signUpError || !authData.user) {
        const { data: normalSignUp, error: normalError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: { data: { full_name: newUser.fullName } },
        })
        if (normalError) throw normalError
        if (!normalSignUp.user) throw new Error('Kullanıcı oluşturulamadı')

        await supabase.from('profiles').insert({
          user_id: normalSignUp.user.id,
          org_id: organization.id,
          branch_id: newUser.branch_id || null,
          full_name: newUser.fullName,
          role: newUser.role,
          is_active: true,
        })
      } else {
        await supabase.from('profiles').insert({
          user_id: authData.user.id,
          org_id: organization.id,
          branch_id: newUser.branch_id || null,
          full_name: newUser.fullName,
          role: newUser.role,
          is_active: true,
        })
      }

      setNewUser({ email: '', password: '', fullName: '', role: 'staff', branch_id: '' })
      setShowAddForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to create user:', err)
      alert(err instanceof Error ? err.message : 'Kullanıcı oluşturulamadı')
    }
  }

  const handleCopyCredentials = (p: Profile) => {
    const loginUrl = `${window.location.origin}/login`
    const text = `SKT Takip Sistemi Giriş Bilgileri\n\nKullanıcı: ${p.full_name}\nE-posta: Kayıt sırasında belirtildi\nŞifre: Kayıt sırasında belirtildi\nGiriş linki: ${loginUrl}\n\nSisteme giriş yaparak SKT takibine başlayabilirsiniz.`
    navigator.clipboard.writeText(text)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDeleteProfile = async () => {
    if (!deleteTarget) return
    await supabase.from('profiles').delete().eq('id', deleteTarget.id)
    setDeleteTarget(null)
    loadData()
  }

  const roleLabels: Record<UserRole, string> = {
    super_admin: 'Süper Admin',
    owner: 'Firma Sahibi',
    branch_manager: 'Şube Müdürü',
    staff: 'Personel',
  }

  const roleIcons: Record<UserRole, typeof Shield> = {
    super_admin: Shield,
    owner: Shield,
    branch_manager: UserIcon,
    staff: UserIcon,
  }

  if (storageMode === 'local') {
    return (
      <main className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Personel</h1>
                <p className="text-xs text-muted-foreground">Yönetim</p>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Yerel Mod</h3>
          <p className="text-sm text-muted-foreground">
            Yerel modda personel yönetimi bulunmaz. Premium hesap oluşturarak personel ekleyebilirsiniz.
          </p>
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Personel</h1>
                <p className="text-xs text-muted-foreground">{profiles.length} kullanıcı</p>
              </div>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setShowAddForm(true)} className="h-9">
                <UserPlus className="w-4 h-4 mr-1" />
                Ekle
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {showAddForm && canManage && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Yeni Personel Ekle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ad Soyad *</Label>
                  <Input
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Personel adı"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-posta *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ornek@email.com"
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Şifre *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="En az 6 karakter"
                    className="h-10"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rol</Label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                  >
                    <option value="staff">Personel</option>
                    {isMultiBranch && <option value="branch_manager">Şube Müdürü</option>}
                  </select>
                </div>
                {isMultiBranch && branches.length > 0 && newUser.role === 'branch_manager' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Şube</Label>
                    <select
                      value={newUser.branch_id}
                      onChange={(e) => setNewUser({ ...newUser, branch_id: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md text-sm bg-background"
                    >
                      <option value="">Şube seç</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 h-10">Oluştur</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>İptal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {profiles.length === 0 && !showAddForm ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Henüz Personel Yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Personel ekleyerek sistem erişimi verebilirsiniz
            </p>
            {canManage && (
              <Button onClick={() => setShowAddForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Personel Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => {
              const RoleIcon = roleIcons[p.role]
              const branch = branches.find(b => b.id === p.branch_id)
              return (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <RoleIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{p.full_name || 'İsimsiz'}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="text-xs">{roleLabels[p.role]}</Badge>
                            {branch && <Badge variant="secondary" className="text-xs">{branch.name}</Badge>}
                            {!p.is_active && <Badge variant="destructive" className="text-xs">Pasif</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopyCredentials(p)}
                          title="Giriş bilgilerini kopyala"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        {canDelete && p.user_id !== profile?.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
        onConfirm={handleDeleteProfile}
        productName={deleteTarget?.full_name || ''}
      />
    </main>
  )
}

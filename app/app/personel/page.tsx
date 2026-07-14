'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { getStorageMode } from '@/lib/repositories/repository.factory'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, Copy, User } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const roleColors: Record<string, any> = {
  super_admin: 'destructive',
  owner: 'default',
  branch_manager: 'secondary',
  staff: 'outline',
}

export default function PersonnelPage() {
  const { profile, organization } = useAuth()
  const storageMode = getStorageMode()

  const [profiles, setProfiles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', role: 'staff', branchId: '' })

  const canManage = profile?.role === 'super_admin' || profile?.role === 'owner'

  useEffect(() => {
    if (storageMode === 'local') { setLoading(false); return }
    loadData()
  }, [storageMode])

  const loadData = async () => {
    const [pRes, bRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('branches').select('*'),
    ])
    if (pRes.data) setProfiles(pRes.data)
    if (bRes.data) setBranches(bRes.data)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.email || !form.password) return
    const { data, error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
    })
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: form.email,
        role: form.role,
        branch_id: form.branchId || null,
        organization_id: organization?.id,
      })
      setForm({ email: '', password: '', role: 'staff', branchId: '' })
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id)
    loadData()
  }

  const handleCopy = (p: any) => {
    const text = `Giris: ${window.location.origin}/login\nEmail: ${p.email}\nSifre: (yonetici tarafindan belirlendi)\nRol: ${p.role}`
    navigator.clipboard.writeText(text)
  }

  if (storageMode === 'local') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="font-semibold text-lg">Personel</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-4">
          <Card className="p-4 text-center text-sm text-gray-500">
            Personel yonetimi local modda kullanilamaz. Remote moduna gecin.
          </Card>
        </main>
        <BottomNav onAddClick={() => {}} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Personel</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {canManage && (
          <Card className="p-4 space-y-2">
            <Label>Yeni Personel</Label>
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input type="password" placeholder="Sifre" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="branch_manager">Branch Manager</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
              <SelectTrigger><SelectValue placeholder="Sube" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1" /> Ekle</Button>
          </Card>
        )}

        {profiles.map((p) => (
          <Card key={p.id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <div>
                <p className="font-medium text-sm">{p.email}</p>
                <Badge variant={roleColors[p.role] || 'outline'}>{p.role}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleCopy(p)}>
                <Copy className="w-3 h-3" />
              </Button>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

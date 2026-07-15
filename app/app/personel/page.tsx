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
import { ArrowLeft, Plus, Trash2, Copy, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Sahip',
  branch_manager: 'Sube Muduru',
  staff: 'Personel',
}

export default function PersonnelPage() {
  const { profile, organization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [storageMode, setStorageModeState] = useState<'supabase' | 'local'>('supabase')

  const [profiles, setProfiles] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'staff', branchId: '' })

  const canManage = profile?.role === 'super_admin' || profile?.role === 'owner'

  useEffect(() => {
    setStorageModeState(getStorageMode())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (storageMode === 'local') { setLoading(false); return }
    if (!organization) return
    loadData()
  }, [storageMode, organization])

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
    if (!form.email || !form.password || !form.fullName) return
    setCreating(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          org_id: organization?.id,
          role: form.role,
          branch_id: form.branchId || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Kullanici olusturulamadi')
      } else {
        setForm({ email: '', password: '', fullName: '', role: 'staff', branchId: '' })
        loadData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata olustu')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (userId: string) => {
    await supabase.from('profiles').delete().eq('user_id', userId)
    loadData()
  }

  const handleCopy = (p: any) => {
    const text = `Giris: ${window.location.origin}/login\nEmail: ${p.email || form.email}\nSifre: (yonetici tarafindan belirlendi)\nRol: ${roleLabels[p.role] || p.role}`
    navigator.clipboard.writeText(text)
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
          <Card className="p-4 space-y-3">
            <Label>Yeni Personel Ekle</Label>
            <Input placeholder="Ad Soyad" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input type="password" placeholder="Sifre" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Personel</SelectItem>
                <SelectItem value="branch_manager">Sube Muduru</SelectItem>
                <SelectItem value="owner">Sahip</SelectItem>
                {profile?.role === 'super_admin' && <SelectItem value="super_admin">Super Admin</SelectItem>}
              </SelectContent>
            </Select>
            {branches.length > 0 && (
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="Sube (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Ekle
            </Button>
          </Card>
        )}

        {profiles.map((p) => (
          <Card key={p.user_id} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <div>
                <p className="font-medium text-sm">{p.full_name || p.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline">{roleLabels[p.role] || p.role}</Badge>
                  {p.branch_id && <Badge variant="secondary">Sube</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleCopy(p)}>
                <Copy className="w-3 h-3" />
              </Button>
              {canManage && p.user_id !== profile?.user_id && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.user_id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {profiles.length === 0 && (
          <Card className="p-4 text-center text-sm text-gray-500">Personel yok.</Card>
        )}
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

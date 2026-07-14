'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Building2, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function BranchesPage() {
  const { profile, organization } = useAuth()
  const [branches, setBranches] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })

  const canManage = profile?.role === 'super_admin' || profile?.role === 'owner'

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [bRes, pRes] = await Promise.all([
      supabase.from('branches').select('*'),
      supabase.from('profiles').select('*'),
    ])
    if (bRes.data) setBranches(bRes.data)
    if (pRes.data) setProfiles(pRes.data)
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await supabase.from('branches').insert({
      name: form.name,
      address: form.address,
      phone: form.phone,
      organization_id: organization?.id,
    })
    setForm({ name: '', address: '', phone: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('branches').delete().eq('id', id)
    loadData()
  }

  const getManager = (branchId: string) => profiles.find((p) => p.branch_id === branchId && p.role === 'branch_manager')
  const getStaffCount = (branchId: string) => profiles.filter((p) => p.branch_id === branchId).length

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/app"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-lg">Subeler</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {canManage && (
          <Card className="p-4 space-y-2">
            <Label>Yeni Sube</Label>
            <Input placeholder="Sube adi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Adres" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1" /> Ekle</Button>
          </Card>
        )}

        {branches.map((b) => {
          const manager = getManager(b.id)
          const staffCount = getStaffCount(b.id)
          return (
            <Card key={b.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <p className="font-medium">{b.name}</p>
                  </div>
                  {b.address && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.address}</p>}
                  {b.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</p>}
                  <div className="flex gap-2 pt-1">
                    <Badge variant="outline">{staffCount} personel</Badge>
                    {manager && <Badge variant="secondary">{manager.email}</Badge>}
                  </div>
                </div>
                {canManage && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}

        {branches.length === 0 && !loading && (
          <Card className="p-4 text-center text-sm text-gray-500">Sube yok.</Card>
        )}
      </main>

      <BottomNav onAddClick={() => {}} />
    </div>
  )
}

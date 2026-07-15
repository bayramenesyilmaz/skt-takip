'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowLeft, Mail, Lock, User, Building2, Store, Smartphone } from 'lucide-react'
import type { OrganizationType } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { getRepository } from '@/lib/repositories/repository.factory'

const orgTypes: { type: OrganizationType; label: string; description: string; icon: typeof Building2 }[] = [
  { type: 'multi_branch', label: 'Cok Subeli Firma', description: 'Birden fazla subesi olan zincir marketler', icon: Building2 },
  { type: 'single_branch', label: 'Tek Subeli Firma', description: 'Tek magaza veya kucuk isletme', icon: Store },
]

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as OrganizationType) || 'single_branch'
  const { signUp } = useAuth()
  const [step, setStep] = useState<'type' | 'details'>(initialType === 'local' ? 'type' : 'details')
  const [orgType, setOrgType] = useState<OrganizationType>(initialType === 'multi_branch' || initialType === 'single_branch' ? initialType : 'single_branch')
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: signUpError, user } = await signUp(email, password, fullName)
      if (signUpError) { setError(signUpError); setLoading(false); return }
      if (!user) { setError('Kullanici olusturulamadi.'); setLoading(false); return }
      const repo = getRepository()
      const org = await repo.createOrganization({ name: orgName, type: orgType, plan: 'premium' })
      const role = orgType === 'multi_branch' ? 'super_admin' : 'owner'
      const { error: profileError } = await supabase.from('profiles').insert({ user_id: user.id, org_id: org.id, full_name: fullName, role, is_active: true })
      if (profileError) {
        setError('Profil olusturulamadi: ' + profileError.message)
        setLoading(false)
        return
      }
      // Wait a moment for the auth session to propagate, then redirect
      setTimeout(() => router.push('/app'), 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata olustu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Ana sayfaya don
        </Link>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl">{step === 'type' ? 'Firma Tipi Sec' : 'Kayit Ol'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {step === 'type' ? (
              <div className="space-y-3">
                {orgTypes.map((t) => (
                  <button key={t.type} onClick={() => { setOrgType(t.type); setStep('details') }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${orgType === t.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><t.icon className="w-5 h-5 text-primary" /></div>
                      <div><h3 className="font-semibold text-foreground">{t.label}</h3><p className="text-sm text-muted-foreground">{t.description}</p></div>
                    </div>
                  </button>
                ))}
                <Link href="/local">
                  <button className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5 text-emerald-600" /></div>
                      <div><h3 className="font-semibold text-foreground">Yerel Mod (Ucretsiz)</h3><p className="text-sm text-muted-foreground">Veritabani gerektirmez, veriler cihazinizda saklanir</p></div>
                    </div>
                  </button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg mb-2">
                  {orgType === 'multi_branch' ? <Building2 className="w-4 h-4 text-primary" /> : <Store className="w-4 h-4 text-primary" />}
                  <span className="text-sm font-medium text-foreground">{orgType === 'multi_branch' ? 'Cok Subeli Firma' : 'Tek Subeli Firma'}</span>
                  <button type="button" onClick={() => setStep('type')} className="ml-auto text-xs text-primary hover:underline">Degistir</button>
                </div>
                <div className="space-y-2"><Label htmlFor="orgName">Firma Adi</Label><Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="orn: ABC Market A.S." className="h-11" required /></div>
                <div className="space-y-2"><Label htmlFor="fullName">Ad Soyad</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adiniz Soyadiniz" className="pl-9 h-11" required /></div></div>
                <div className="space-y-2"><Label htmlFor="email">E-posta</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com" className="pl-9 h-11" required /></div></div>
                <div className="space-y-2"><Label htmlFor="password">Sifre</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" className="pl-9 h-11" minLength={6} required /></div></div>
                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? 'Kayit olusturuluyor...' : 'Kayit Ol'}</Button>
                <p className="text-center text-sm text-muted-foreground">Zaten hesabin var mi? <Link href="/login" className="text-primary font-medium hover:underline">Giris yap</Link></p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

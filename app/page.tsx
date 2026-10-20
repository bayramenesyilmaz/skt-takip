'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ONBOARDING_SLIDES } from '@/lib/onboarding-slides'

const WELCOME_SEEN_KEY = 'skt-welcome-seen'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forceIntro = searchParams.get('intro') === '1'
  const [showLanding, setShowLanding] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (!forceIntro && localStorage.getItem(WELCOME_SEEN_KEY)) {
      router.replace('/app')
      return
    }
    localStorage.setItem(WELCOME_SEEN_KEY, '1')
    setShowLanding(true)
  }, [router, forceIntro])

  if (!showLanding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isLast = slide === ONBOARDING_SLIDES.length - 1
  const current = ONBOARDING_SLIDES[slide]
  const Icon = current.icon

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="flex justify-end p-4">
        <Link href="/app"><Button variant="ghost" size="sm">Atla</Button></Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
          {current.title}
        </h1>
        <p className="text-base text-muted-foreground">
          {current.description}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 pb-6">
        {ONBOARDING_SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Slayt ${i + 1}`}
            onClick={() => setSlide(i)}
            className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`}
          />
        ))}
      </div>

      <div className="px-6 pb-10 max-w-md mx-auto w-full flex gap-3">
        {slide > 0 && (
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setSlide((s) => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />Geri
          </Button>
        )}
        {isLast ? (
          <Link href="/app" className="flex-1">
            <Button size="lg" className="w-full">
              Uygulamayi Ac<Check className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="flex-1" onClick={() => setSlide((s) => s + 1)}>
            Ileri<ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  )
}

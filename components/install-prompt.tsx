"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, WifiOff } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[SW] Registered:', reg.scope))
        .catch((err) => console.log('[SW] Failed:', err))
    }
    
    // Check initial online status
    setIsOffline(!navigator.onLine)
    
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if PWA prompt is disabled (localStorage)
    const pwaDisabled = localStorage.getItem('pwa-prompt-disabled')
    if (pwaDisabled === 'true') {
      return
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  const handleDisablePrompt = () => {
    localStorage.setItem('pwa-prompt-disabled', 'true')
    setShowPrompt(false)
  }

  if (!isMounted) return null

  return (
    <>
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-xs font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          Cevrimdisi mod - Verileriniz kayitli
        </div>
      )}
      
      {/* Install Prompt */}
      {showPrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-4">
          <Card className="border-primary/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">
                    Uygulamayi Yukle
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ana ekrana ekle, offline kullan
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-8" onClick={handleInstall}>
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Yukle
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={handleDismiss}>
                      Sonra
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

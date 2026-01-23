"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // For iOS - show custom prompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS && !isInstalled) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setShowPrompt(false)
        setIsInstalled(true)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isInstalled) return null

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">
                Uygulamayı Yükle
              </h4>
              {isIOS ? (
                <p className="text-sm text-muted-foreground mb-3">
                  Safari menüsünden <span className="font-medium">{"\"Ana Ekrana Ekle\""}</span> seçeneğine tıklayın.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  Ana ekrana ekleyerek hızlı erişim sağlayın.
                </p>
              )}
              <div className="flex gap-2">
                {!isIOS && (
                  <Button size="sm" onClick={handleInstall} className="gap-1">
                    <Download className="w-4 h-4" />
                    Yükle
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  {isIOS ? 'Anladım' : 'Şimdi Değil'}
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

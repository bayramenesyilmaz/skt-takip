"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptContextValue {
  canInstall: boolean
  isStandalone: boolean
  promptInstall: () => Promise<void>
}

const InstallPromptContext = createContext<InstallPromptContextValue>({
  canInstall: false,
  isStandalone: false,
  promptInstall: async () => {},
})

export function useInstallPrompt() {
  return useContext(InstallPromptContext)
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsStandalone(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  return (
    <InstallPromptContext.Provider
      value={{ canInstall: !!deferredPrompt && !isStandalone, isStandalone, promptInstall }}
    >
      {children}
    </InstallPromptContext.Provider>
  )
}

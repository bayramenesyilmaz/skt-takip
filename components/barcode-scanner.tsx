"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Camera, SwitchCamera, Keyboard, Check } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const scannedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isMounted, setIsMounted] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualValue, setManualValue] = useState('')

  useEffect(() => {
    setIsMounted(true)
    readerRef.current = new BrowserMultiFormatReader()
    return () => setIsMounted(false)
  }, [])

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
  }, [])

  const handleScan = useCallback((value: string) => {
    if (scannedRef.current) return
    scannedRef.current = true
    stopScanner()
    onScan(value)
  }, [onScan, stopScanner])

  const startScanner = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Kamera erişimi bu cihazda desteklenmiyor. Manuel giriş yapabilirsiniz.')
      return
    }
    const reader = readerRef.current
    const video = videoRef.current
    if (!reader || !video) return

    stopScanner()
    setError(null)

    try {
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: facingMode } } },
        video,
        (result) => {
          if (result) handleScan(result.getText())
        },
      )
      controlsRef.current = controls
    } catch (err) {
      console.error('[v0] Scanner error:', err)
      setError('Kamera açılamadı. Lütfen kamera iznini verin veya manuel giriş yapın.')
    }
  }, [facingMode, handleScan, stopScanner])

  useEffect(() => {
    if (!isMounted || manualMode) return
    startScanner()
    return () => stopScanner()
  }, [isMounted, manualMode, facingMode, startScanner, stopScanner])

  const toggleCamera = () => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualValue.trim()
    if (trimmed) handleScan(trimmed)
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Barkod Tara</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {manualMode ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center">
                  <Keyboard className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">Barkodu Elle Gir</h3>
                  <p className="text-sm text-muted-foreground mt-1">Kamera çalışmıyorsa barkod numarasını yazın</p>
                </div>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <Input
                    autoFocus
                    inputMode="numeric"
                    placeholder="8690..."
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    className="h-12 text-center text-lg tracking-wider"
                  />
                  <Button type="submit" className="w-full h-11" disabled={!manualValue.trim()}>
                    <Check className="w-4 h-4 mr-2" />Onayla
                  </Button>
                  <Button type="button" variant="outline" className="w-full h-11" onClick={() => setManualMode(false)}>
                    <Camera className="w-4 h-4 mr-2" />Kameraya Dön
                  </Button>
                </form>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4 max-w-xs">{error}</p>
              <div className="flex gap-2">
                <Button onClick={startScanner}>Tekrar Dene</Button>
                <Button variant="outline" onClick={() => setManualMode(true)}>
                  <Keyboard className="w-4 h-4 mr-2" />Elle Gir
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary/50 animate-pulse" />
                </div>
              </div>

              <div className="absolute bottom-24 left-0 right-0 text-center px-4">
                <p className="text-foreground bg-background/80 inline-block px-4 py-2 rounded-full text-sm">
                  Barkodu çerçeve içine hizalayın
                </p>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
                <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={toggleCamera} title="Kamerayı değiştir">
                  <SwitchCamera className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={() => setManualMode(true)} title="Elle gir">
                  <Keyboard className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Tüm telefonlarda çalışır - okutamazsanız klavye simgesiyle elle girebilirsiniz
          </p>
        </div>
      </div>
    </div>
  )
}

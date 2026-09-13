"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera, SwitchCamera } from 'lucide-react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  secondaryAction?: { label: string; onClick: () => void }
}

const NO_RESULT_TIMEOUT_MS = 7000

export function BarcodeScanner({ onScan, onClose, secondaryAction }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isMounted, setIsMounted] = useState(false)
  const [showManualHint, setShowManualHint] = useState(false)
  const controlsRef = useRef<IScannerControls | null>(null)
  const noResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop())
    if (noResultTimeoutRef.current) {
      clearTimeout(noResultTimeoutRef.current)
      noResultTimeoutRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    stopCamera()
    setShowManualHint(false)

    if (window.isSecureContext === false) {
      setError('Bu sayfa guvenli (HTTPS) baglanti uzerinden acilmadigi icin kamera kullanilamiyor. Uygulamaya https:// ile erisin.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Bu tarayici kamera erisimini desteklemiyor.')
      return
    }

    if (!videoRef.current) return

    try {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 })

      noResultTimeoutRef.current = setTimeout(() => setShowManualHint(true), NO_RESULT_TIMEOUT_MS)

      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result) => {
          if (result) {
            if (noResultTimeoutRef.current) {
              clearTimeout(noResultTimeoutRef.current)
              noResultTimeoutRef.current = null
            }
            stopCamera()
            onScan(result.getText())
          }
        }
      )

      controlsRef.current = controls
      setError(null)
    } catch (err) {
      console.error('Camera error:', err)
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        setError('Kamera izni reddedildi. Tarayicinizin adres cubugundaki kilit/site bilgisi simgesinden bu sitenin kamera iznini "Izin Ver" olarak degistirip sayfayi yenileyin.')
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('Cihazda kullanilabilir bir kamera bulunamadi.')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('Kameraya erisilemedi. Kamerayi baska bir uygulama kullaniyor olabilir, o uygulamayi kapatip tekrar deneyin.')
      } else if (name === 'OverconstrainedError') {
        setError('Cihazinizin kamerasi istenen ayarlari desteklemiyor.')
      } else {
        setError(`Kamera erisimi saglanamadi${name ? ` (${name})` : ''}. Lutfen kamera izinlerini kontrol edin.`)
      }
    }
  }, [facingMode, onScan, stopCamera])

  useEffect(() => {
    if (!isMounted) return

    startCamera()

    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, facingMode])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const handleClose = () => {
    stopCamera()
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
          {error ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={startCamera}>Tekrar Dene</Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                  {/* Scanning line animation */}
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-primary/50 animate-pulse" />
                </div>
              </div>

              <div className="absolute bottom-24 left-0 right-0 text-center">
                <p className="text-foreground bg-background/80 inline-block px-4 py-2 rounded-full text-sm">
                  {showManualHint
                    ? 'Barkod bulunamadi. Barkodu net bir sekilde cerceveye alin ya da manuel giris yapin.'
                    : 'Barkodu çerçeve içine hizalayın'}
                </p>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={toggleCamera}
                >
                  <SwitchCamera className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-card border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            {error ? 'Kamera kullanilamiyor. Manuel giris yapabilirsiniz.' : 'Otomatik barkod algilama aktif'}
          </p>
          {secondaryAction && (
            <Button variant="outline" className="w-full" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

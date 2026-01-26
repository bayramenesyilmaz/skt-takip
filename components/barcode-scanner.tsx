"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera, SwitchCamera } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isMounted, setIsMounted] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera erişimi desteklenmiyor.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setError(null)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol edin.')
    }
  }, [facingMode])

  useEffect(() => {
    if (!isMounted) return
    
    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isMounted, facingMode, startCamera])

  // BarcodeDetector API for scanning
  useEffect(() => {
    if (!isMounted || !videoRef.current || error) return
    if (typeof window === 'undefined') return

    let animationId: number
    let isScanning = true

    const detectBarcode = async () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationId = requestAnimationFrame(detectBarcode)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Check if BarcodeDetector is available
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          // @ts-ignore - BarcodeDetector is experimental
          const barcodeDetector = new (window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => { detect: (source: HTMLCanvasElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
          })
          const barcodes = await barcodeDetector.detect(canvas)
          
          if (barcodes.length > 0) {
            isScanning = false
            onScan(barcodes[0].rawValue)
            return
          }
        } catch (e) {
          console.error('Barcode detection error:', e)
        }
      }

      animationId = requestAnimationFrame(detectBarcode)
    }

    const timeoutId = setTimeout(detectBarcode, 500)

    return () => {
      isScanning = false
      cancelAnimationFrame(animationId)
      clearTimeout(timeoutId)
    }
  }, [isMounted, error, onScan])

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Barkod Tara</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
              />
              <canvas ref={canvasRef} className="hidden" />
              
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
                  Barkodu çerçeve içine hizalayın
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

        <div className="p-4 bg-card border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {isMounted && typeof window !== 'undefined' && 'BarcodeDetector' in window 
              ? 'Otomatik barkod algılama aktif'
              : 'Tarayıcınız barkod algılamayı desteklemiyor. Manuel giriş yapabilirsiniz.'}
          </p>
        </div>
      </div>
    </div>
  )
}

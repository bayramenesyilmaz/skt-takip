import React from "react"
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/lib/auth/auth-context'
import { InstallPrompt } from '@/components/install-prompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'SKT Takip - Son Kullanma Tarihi Yonetimi',
  description: 'Market reyon gorevlileri icin profesyonel son kullanma tarihi takip uygulamasi.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icon-192.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SKT Takip' },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <InstallPrompt />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

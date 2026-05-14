import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AppProviders } from '@/components/app-providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'SKT Takip - Son Kullanma Tarihi Yönetimi',
  description: 'Market reyon görevlileri için profesyonel son kullanma tarihi takip uygulaması. Ürünlerinizi kolayca ekleyin, takip edin ve bildirim alın.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  keywords: ['skt', 'son kullanma tarihi', 'market', 'reyon', 'stok takip'],
  authors: [{ name: 'SKT Takip' }],
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SKT Takip',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <AppProviders />
        <Analytics />
      </body>
    </html>
  )
}

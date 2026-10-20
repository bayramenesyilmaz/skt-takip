import React from "react"
import type { Metadata, Viewport } from 'next'
import { InstallPrompt } from '@/components/install-prompt'
import { InstallPromptProvider } from '@/lib/context/install-prompt-context'
import { SITE_URL } from '@/lib/seo'
import './globals.css'

const TITLE = 'SKT Takip - Son Kullanma Tarihi Yonetimi'
const DESCRIPTION = 'Market ve bakkal reyon gorevlileri icin barkod tarayarak calisan, tamamen cevrimdisi son kullanma tarihi (SKT) takip, stok ve iade yonetimi uygulamasi.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | SKT Takip' },
  description: DESCRIPTION,
  keywords: ['SKT takip', 'son kullanma tarihi takip', 'market stok takibi', 'barkod ile urun takibi', 'reyon uygulamasi', 'iade takip', 'market yazilimi'],
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icon-192.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SKT Takip' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    siteName: 'SKT Takip',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/icon-512.png', width: 512, height: 512 }],
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/icon-512.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SKT Takip',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  url: SITE_URL,
  description: DESCRIPTION,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
  inLanguage: 'tr',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className="font-sans antialiased">
        <InstallPromptProvider>
          <InstallPrompt />
          {children}
        </InstallPromptProvider>
      </body>
    </html>
  )
}

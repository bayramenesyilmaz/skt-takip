// Gercek alan adi alindiginda NEXT_PUBLIC_SITE_URL build ortam degiskenini
// o adrese ayarlayin; degisken bos oldugunda bu varsayilan kullanilir.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://skt-takip.vercel.app').replace(/\/$/, '')

// Reklam alani henuz pasif: gercek bir reklam hesabi/alan adi baglanana
// kadar NEXT_PUBLIC_ADS_ENABLED tanimlanmadiginda AdSlot hicbir sey render etmez.
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'

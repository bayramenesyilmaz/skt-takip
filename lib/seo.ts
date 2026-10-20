// Gercek alan adi alindiginda NEXT_PUBLIC_SITE_URL build ortam degiskenini
// o adrese ayarlayin; degisken bos oldugunda bu varsayilan kullanilir.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://skt-takip.vercel.app').replace(/\/$/, '')

// Reklam alanlari varsayilan olarak gorunur (yer tutucu "Reklam Alani" bannerlari).
// Gercek bir reklam hesabi baglanana kadar bu alanlar sadece yer ayirir; tamamen
// kapatmak icin build ortamina NEXT_PUBLIC_ADS_ENABLED=false eklemek yeterlidir.
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED !== 'false'

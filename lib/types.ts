export type ProductType = 'shelf' | 'freezer-18' | 'fridge-4' | 'processed'

export interface Product {
  id: string
  name: string
  stockCode?: string
  barcode?: string
  brand?: string // Marka
  expiryDate: string
  productType?: ProductType
  createdAt: string
  updatedAt: string
}

// Ayarlar
export interface AppSettings {
  allBrands: string[] // tüm markalar
  noReturnBrands: string[] // iade almayan markalar
}

// Yeni gelismiş durum sistemi
export type ExpiryStatus = 
  | 'expired'      // Suresi gecmis
  | 'critical'     // 0-3 gun (ACIL - raftan kaldir)
  | 'remove'       // 4-14 gun (Raftan kaldirilabilir)
  | 'campaign'     // 15-90 gun (Kampanya onerisi)
  | 'safe'         // 90+ gun (Guvenli)

export interface ExpiryInfo {
  status: ExpiryStatus
  daysLeft: number
  label: string
  actionRequired: string
}

export interface ParsedProduct {
  name: string
  expiryDate: string
  isValid: boolean
  error?: string
}

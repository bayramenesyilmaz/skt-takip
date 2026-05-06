export type ProductType = 'shelf' | 'freezer-18' | 'fridge-4' | 'processed'

export interface Product {
  id: string
  name: string
  stockCode?: string
  barcode?: string
  expiryDate: string
  productType?: ProductType // Raf/Dolap tipi: Normal Raf, -18°C Dolap, +4°C Dolap, İşlenmiş
  locationId?: string
  createdAt: string
  updatedAt: string
}

// Lokasyon sistemi - Reyon, Palet, Depo vb.
export interface Location {
  id: string
  name: string
  type: 'reyon' | 'palet' | 'depo' | 'dolap' | 'raf'
  parentId?: string // Alt lokasyonlar icin
  createdAt: string
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

export interface Product {
  id: string
  name: string
  stockCode: string
  barcode: string
  expiryDate: string
  category?: ProductCategory
  createdAt: string
  updatedAt: string
}

export type ProductCategory = 'dairy' | 'general' | 'frozen' | 'bakery'

// Yeni gelişmiş durum sistemi
export type ExpiryStatus = 
  | 'expired'      // Süresi geçmiş
  | 'critical'     // 0-3 gün (ACİL - raftan kaldır)
  | 'remove'       // 4-14 gün (Raftan kaldırılabilir)
  | 'campaign'     // 15-90 gün (Kampanya önerisi)
  | 'safe'         // 90+ gün (Güvenli)

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

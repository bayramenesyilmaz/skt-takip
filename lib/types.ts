export type ExpiryStatus = 'expired' | 'critical' | 'remove' | 'campaign' | 'safe'

export interface Brand {
  id: string
  name: string
  return_accepts: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  stock_code?: string
  barcode?: string
  brand_id?: string
  return_accepts: boolean
  created_at: string
  updated_at: string
}

export interface StockItem {
  id: string
  product_id: string
  expiry_date: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface ExpiryInfo {
  status: ExpiryStatus
  daysLeft: number
  label: string
  actionRequired: string
}

export interface ProductWithStock extends Product {
  brand?: Brand
  stock_items?: StockItem[]
  total_quantity?: number
}

export interface ParsedProduct {
  name: string
  expiryDate: string
  stockCode?: string
  barcode?: string
  brand?: string
  isValid: boolean
  error?: string
}

export interface Pallet {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface PalletItem {
  id: string
  pallet_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface PalletWithItems extends Pallet {
  items?: (PalletItem & { product?: Product })[]
}

export interface BackupData {
  app: 'skt-takip'
  schema: 1
  exportedAt: string
  brands: Brand[]
  products: (Product & { stock_items: StockItem[] })[]
  pallets: (Pallet & { items: PalletItem[] })[]
}

export interface RestoreResult {
  brandsAdded: number
  productsAdded: number
  stockItemsAdded: number
  palletsAdded: number
  palletItemsAdded: number
}

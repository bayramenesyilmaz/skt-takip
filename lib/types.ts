export interface Product {
  id: string
  name: string
  stockCode: string
  barcode: string
  expiryDate: string
  createdAt: string
  updatedAt: string
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'safe'

export interface ExpiryInfo {
  status: ExpiryStatus
  daysLeft: number
  label: string
}

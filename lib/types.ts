export type OrganizationType = 'multi_branch' | 'single_branch' | 'local'
export type UserRole = 'super_admin' | 'owner' | 'branch_manager' | 'staff'
export type LocationType = 'reyon' | 'palet' | 'depo' | 'dolap' | 'raf'
export type ExpiryStatus = 'expired' | 'critical' | 'remove' | 'campaign' | 'safe'

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  plan: 'premium' | 'free' | 'local'
  created_at: string
  updated_at: string
}

export interface Branch {
  id: string
  org_id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  org_id?: string
  branch_id?: string
  full_name?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  org_id: string
  branch_id?: string
  name: string
  type: LocationType
  parent_id?: string
  level: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  org_id: string
  branch_id?: string
  name: string
  return_accepts: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  org_id: string
  branch_id?: string
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
  org_id: string
  branch_id?: string
  product_id: string
  location_id?: string
  expiry_date: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface ImportTemplate {
  id: string
  org_id: string
  branch_id?: string
  name: string
  column_mapping: Record<string, string>
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
  locations?: Location[]
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

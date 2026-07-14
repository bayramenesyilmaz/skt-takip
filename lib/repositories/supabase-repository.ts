import { supabase } from '@/lib/supabase/client'
import type { IRepository } from '@/lib/repositories/repository.interface'
import type {
  Organization,
  Branch,
  Profile,
  Location,
  Brand,
  Product,
  StockItem,
  ImportTemplate,
  ProductWithStock,
} from '@/lib/types'

export class SupabaseRepository implements IRepository {
  // ============================================================
  // ORGANIZATIONS
  // ============================================================
  async getOrganization(orgId: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle()
    if (error) throw error
    return data as Organization | null
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    const { data: result, error } = await supabase
      .from('organizations')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Organization
  }

  async updateOrganization(orgId: string, data: Partial<Organization>): Promise<void> {
    const { error } = await supabase.from('organizations').update(data).eq('id', orgId)
    if (error) throw error
  }

  // ============================================================
  // BRANCHES
  // ============================================================
  async getBranches(orgId: string): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as Branch[]) || []
  }

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const { data: result, error } = await supabase
      .from('branches')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Branch
  }

  async updateBranch(branchId: string, data: Partial<Branch>): Promise<void> {
    const { error } = await supabase.from('branches').update(data).eq('id', branchId)
    if (error) throw error
  }

  async deleteBranch(branchId: string): Promise<void> {
    const { error } = await supabase.from('branches').delete().eq('id', branchId)
    if (error) throw error
  }

  // ============================================================
  // PROFILES
  // ============================================================
  async getProfiles(orgId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data as Profile[]) || []
  }

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const { data: result, error } = await supabase
      .from('profiles')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Profile
  }

  async updateProfile(profileId: string, data: Partial<Profile>): Promise<void> {
    const { error } = await supabase.from('profiles').update(data).eq('id', profileId)
    if (error) throw error
  }

  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', profileId)
    if (error) throw error
  }

  // ============================================================
  // LOCATIONS
  // ============================================================
  async getLocations(orgId: string, branchId?: string): Promise<Location[]> {
    let query = supabase.from('locations').select('*').eq('org_id', orgId)
    if (branchId) query = query.eq('branch_id', branchId)
    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw error
    return (data as Location[]) || []
  }

  async createLocation(data: Partial<Location>): Promise<Location> {
    const { data: result, error } = await supabase
      .from('locations')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Location
  }

  async updateLocation(locationId: string, data: Partial<Location>): Promise<void> {
    const { error } = await supabase.from('locations').update(data).eq('id', locationId)
    if (error) throw error
  }

  async deleteLocation(locationId: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', locationId)
    if (error) throw error
  }

  // ============================================================
  // BRANDS
  // ============================================================
  async getBrands(orgId: string, branchId?: string): Promise<Brand[]> {
    let query = supabase.from('brands').select('*').eq('org_id', orgId)
    if (branchId) query = query.eq('branch_id', branchId)
    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error
    return (data as Brand[]) || []
  }

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const { data: result, error } = await supabase
      .from('brands')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Brand
  }

  async updateBrand(brandId: string, data: Partial<Brand>): Promise<void> {
    const { error } = await supabase.from('brands').update(data).eq('id', brandId)
    if (error) throw error
  }

  async deleteBrand(brandId: string): Promise<void> {
    const { error } = await supabase.from('brands').delete().eq('id', brandId)
    if (error) throw error
  }

  // ============================================================
  // PRODUCTS
  // ============================================================
  async getProducts(orgId: string, branchId?: string): Promise<ProductWithStock[]> {
    let query = supabase
      .from('products')
      .select('*, brand:brands(*), stock_items:stock_items(*)')
      .eq('org_id', orgId)
    if (branchId) query = query.eq('branch_id', branchId)
    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error
    return (data as ProductWithStock[]) || []
  }

  async getProduct(productId: string): Promise<ProductWithStock | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, brand:brands(*), stock_items:stock_items(*)')
      .eq('id', productId)
      .maybeSingle()
    if (error) throw error
    return data as ProductWithStock | null
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const { data: result, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Product
  }

  async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    const { error } = await supabase.from('products').update(data).eq('id', productId)
    if (error) throw error
  }

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) throw error
  }

  async bulkCreateProducts(items: Partial<Product>[]): Promise<Product[]> {
    const { data, error } = await supabase.from('products').insert(items).select()
    if (error) throw error
    return (data as Product[]) || []
  }

  // ============================================================
  // STOCK ITEMS
  // ============================================================
  async getStockItems(productId: string): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('product_id', productId)
      .order('expiry_date', { ascending: true })
    if (error) throw error
    return (data as StockItem[]) || []
  }

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    const { data: result, error } = await supabase
      .from('stock_items')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as StockItem
  }

  async updateStockItem(stockId: string, data: Partial<StockItem>): Promise<void> {
    const { error } = await supabase.from('stock_items').update(data).eq('id', stockId)
    if (error) throw error
  }

  async deleteStockItem(stockId: string): Promise<void> {
    const { error } = await supabase.from('stock_items').delete().eq('id', stockId)
    if (error) throw error
  }

  async bulkCreateStockItems(items: Partial<StockItem>[]): Promise<StockItem[]> {
    const { data, error } = await supabase.from('stock_items').insert(items).select()
    if (error) throw error
    return (data as StockItem[]) || []
  }

  // ============================================================
  // IMPORT TEMPLATES
  // ============================================================
  async getImportTemplates(orgId: string, branchId?: string): Promise<ImportTemplate[]> {
    let query = supabase.from('import_templates').select('*').eq('org_id', orgId)
    if (branchId) query = query.eq('branch_id', branchId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data as ImportTemplate[]) || []
  }

  async createImportTemplate(data: Partial<ImportTemplate>): Promise<ImportTemplate> {
    const { data: result, error } = await supabase
      .from('import_templates')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as ImportTemplate
  }

  async updateImportTemplate(templateId: string, data: Partial<ImportTemplate>): Promise<void> {
    const { error } = await supabase.from('import_templates').update(data).eq('id', templateId)
    if (error) throw error
  }

  async deleteImportTemplate(templateId: string): Promise<void> {
    const { error } = await supabase.from('import_templates').delete().eq('id', templateId)
    if (error) throw error
  }
}

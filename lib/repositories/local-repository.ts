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

const KEYS = {
  org: 'skt-local-org',
  branches: 'skt-local-branches',
  profiles: 'skt-local-profiles',
  locations: 'skt-local-locations',
  brands: 'skt-local-brands',
  products: 'skt-local-products',
  stock: 'skt-local-stock',
  templates: 'skt-local-templates',
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string {
  return new Date().toISOString()
}

export class LocalRepository implements IRepository {
  async getOrganization(orgId: string): Promise<Organization | null> {
    return read<Organization>(KEYS.org).find((o) => o.id === orgId) || null
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    const org: Organization = { id: uid(), name: data.name || 'Local Org', type: 'local', plan: 'local', created_at: now(), updated_at: now() }
    write(KEYS.org, [org])
    return org
  }

  async updateOrganization(orgId: string, data: Partial<Organization>): Promise<void> {
    const orgs = read<Organization>(KEYS.org)
    const idx = orgs.findIndex((o) => o.id === orgId)
    if (idx >= 0) { orgs[idx] = { ...orgs[idx], ...data, updated_at: now() }; write(KEYS.org, orgs) }
  }

  async getBranches(_orgId: string): Promise<Branch[]> { return read<Branch>(KEYS.branches) }

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const branch: Branch = { id: uid(), org_id: data.org_id || '', name: data.name || '', address: data.address, phone: data.phone, created_at: now(), updated_at: now() }
    const branches = read<Branch>(KEYS.branches); branches.push(branch); write(KEYS.branches, branches); return branch
  }

  async updateBranch(branchId: string, data: Partial<Branch>): Promise<void> {
    const branches = read<Branch>(KEYS.branches); const idx = branches.findIndex((b) => b.id === branchId)
    if (idx >= 0) { branches[idx] = { ...branches[idx], ...data, updated_at: now() }; write(KEYS.branches, branches) }
  }

  async deleteBranch(branchId: string): Promise<void> {
    write(KEYS.branches, read<Branch>(KEYS.branches).filter((b) => b.id !== branchId))
  }

  async getProfiles(_orgId: string): Promise<Profile[]> { return read<Profile>(KEYS.profiles) }

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    const profile: Profile = { id: uid(), user_id: data.user_id || uid(), org_id: data.org_id, branch_id: data.branch_id, full_name: data.full_name, role: data.role || 'staff', is_active: data.is_active ?? true, created_at: now(), updated_at: now() }
    const profiles = read<Profile>(KEYS.profiles); profiles.push(profile); write(KEYS.profiles, profiles); return profile
  }

  async updateProfile(profileId: string, data: Partial<Profile>): Promise<void> {
    const profiles = read<Profile>(KEYS.profiles); const idx = profiles.findIndex((p) => p.id === profileId)
    if (idx >= 0) { profiles[idx] = { ...profiles[idx], ...data, updated_at: now() }; write(KEYS.profiles, profiles) }
  }

  async deleteProfile(profileId: string): Promise<void> {
    write(KEYS.profiles, read<Profile>(KEYS.profiles).filter((p) => p.id !== profileId))
  }

  async getLocations(orgId: string, branchId?: string): Promise<Location[]> {
    let locations = read<Location>(KEYS.locations).filter((l) => l.org_id === orgId)
    if (branchId) locations = locations.filter((l) => l.branch_id === branchId)
    return locations.sort((a, b) => a.sort_order - b.sort_order)
  }

  async createLocation(data: Partial<Location>): Promise<Location> {
    const location: Location = { id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, name: data.name || '', type: data.type || 'reyon', parent_id: data.parent_id, level: data.level || 1, sort_order: data.sort_order || 0, created_at: now(), updated_at: now() }
    const locations = read<Location>(KEYS.locations); locations.push(location); write(KEYS.locations, locations); return location
  }

  async updateLocation(locationId: string, data: Partial<Location>): Promise<void> {
    const locations = read<Location>(KEYS.locations); const idx = locations.findIndex((l) => l.id === locationId)
    if (idx >= 0) { locations[idx] = { ...locations[idx], ...data, updated_at: now() }; write(KEYS.locations, locations) }
  }

  async deleteLocation(locationId: string): Promise<void> {
    const locations = read<Location>(KEYS.locations)
    write(KEYS.locations, locations.filter((l) => l.id !== locationId && l.parent_id !== locationId))
  }

  async getBrands(orgId: string, branchId?: string): Promise<Brand[]> {
    let brands = read<Brand>(KEYS.brands).filter((b) => b.org_id === orgId)
    if (branchId) brands = brands.filter((b) => b.branch_id === branchId)
    return brands.sort((a, b) => a.name.localeCompare(b.name))
  }

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const brand: Brand = { id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, name: data.name || '', return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }
    const brands = read<Brand>(KEYS.brands); brands.push(brand); write(KEYS.brands, brands); return brand
  }

  async updateBrand(brandId: string, data: Partial<Brand>): Promise<void> {
    const brands = read<Brand>(KEYS.brands); const idx = brands.findIndex((b) => b.id === brandId)
    if (idx >= 0) { brands[idx] = { ...brands[idx], ...data, updated_at: now() }; write(KEYS.brands, brands) }
  }

  async deleteBrand(brandId: string): Promise<void> {
    write(KEYS.brands, read<Brand>(KEYS.brands).filter((b) => b.id !== brandId))
  }

  async getProducts(orgId: string, branchId?: string): Promise<ProductWithStock[]> {
    let products = read<Product>(KEYS.products).filter((p) => p.org_id === orgId)
    if (branchId) products = products.filter((p) => p.branch_id === branchId)
    const stock = read<StockItem>(KEYS.stock)
    const brands = read<Brand>(KEYS.brands)
    return products.map((p) => {
      const items = stock.filter((s) => s.product_id === p.id)
      const brand = brands.find((b) => b.id === p.brand_id)
      return { ...p, brand, stock_items: items, total_quantity: items.reduce((sum, s) => sum + s.quantity, 0) } as ProductWithStock
    }).sort((a, b) => a.name.localeCompare(b.name))
  }

  async getProduct(productId: string): Promise<ProductWithStock | null> {
    const product = read<Product>(KEYS.products).find((p) => p.id === productId)
    if (!product) return null
    const stock = read<StockItem>(KEYS.stock).filter((s) => s.product_id === productId)
    const brand = read<Brand>(KEYS.brands).find((b) => b.id === product.brand_id)
    return { ...product, brand, stock_items: stock, total_quantity: stock.reduce((sum, s) => sum + s.quantity, 0) } as ProductWithStock
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const product: Product = { id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, name: data.name || '', stock_code: data.stock_code, barcode: data.barcode, brand_id: data.brand_id, return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }
    const products = read<Product>(KEYS.products); products.push(product); write(KEYS.products, products); return product
  }

  async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    const products = read<Product>(KEYS.products); const idx = products.findIndex((p) => p.id === productId)
    if (idx >= 0) { products[idx] = { ...products[idx], ...data, updated_at: now() }; write(KEYS.products, products) }
  }

  async deleteProduct(productId: string): Promise<void> {
    write(KEYS.products, read<Product>(KEYS.products).filter((p) => p.id !== productId))
    write(KEYS.stock, read<StockItem>(KEYS.stock).filter((s) => s.product_id !== productId))
  }

  async bulkCreateProducts(items: Partial<Product>[]): Promise<Product[]> {
    const products = read<Product>(KEYS.products)
    const newProducts: Product[] = items.map((data) => ({ id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, name: data.name || '', stock_code: data.stock_code, barcode: data.barcode, brand_id: data.brand_id, return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }))
    write(KEYS.products, [...products, ...newProducts]); return newProducts
  }

  async getStockItems(productId: string): Promise<StockItem[]> {
    return read<StockItem>(KEYS.stock).filter((s) => s.product_id === productId).sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  }

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    const item: StockItem = { id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, product_id: data.product_id || '', location_id: data.location_id, expiry_date: data.expiry_date || now(), quantity: data.quantity ?? 1, created_at: now(), updated_at: now() }
    const stock = read<StockItem>(KEYS.stock); stock.push(item); write(KEYS.stock, stock); return item
  }

  async updateStockItem(stockId: string, data: Partial<StockItem>): Promise<void> {
    const stock = read<StockItem>(KEYS.stock); const idx = stock.findIndex((s) => s.id === stockId)
    if (idx >= 0) { stock[idx] = { ...stock[idx], ...data, updated_at: now() }; write(KEYS.stock, stock) }
  }

  async deleteStockItem(stockId: string): Promise<void> {
    write(KEYS.stock, read<StockItem>(KEYS.stock).filter((s) => s.id !== stockId))
  }

  async bulkCreateStockItems(items: Partial<StockItem>[]): Promise<StockItem[]> {
    const stock = read<StockItem>(KEYS.stock)
    const newItems: StockItem[] = items.map((data) => ({ id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, product_id: data.product_id || '', location_id: data.location_id, expiry_date: data.expiry_date || now(), quantity: data.quantity ?? 1, created_at: now(), updated_at: now() }))
    write(KEYS.stock, [...stock, ...newItems]); return newItems
  }

  async getImportTemplates(orgId: string, branchId?: string): Promise<ImportTemplate[]> {
    let templates = read<ImportTemplate>(KEYS.templates).filter((t) => t.org_id === orgId)
    if (branchId) templates = templates.filter((t) => t.branch_id === branchId)
    return templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async createImportTemplate(data: Partial<ImportTemplate>): Promise<ImportTemplate> {
    const template: ImportTemplate = { id: uid(), org_id: data.org_id || '', branch_id: data.branch_id, name: data.name || 'Default Template', column_mapping: data.column_mapping || {}, created_at: now(), updated_at: now() }
    const templates = read<ImportTemplate>(KEYS.templates); templates.push(template); write(KEYS.templates, templates); return template
  }

  async updateImportTemplate(templateId: string, data: Partial<ImportTemplate>): Promise<void> {
    const templates = read<ImportTemplate>(KEYS.templates); const idx = templates.findIndex((t) => t.id === templateId)
    if (idx >= 0) { templates[idx] = { ...templates[idx], ...data, updated_at: now() }; write(KEYS.templates, templates) }
  }

  async deleteImportTemplate(templateId: string): Promise<void> {
    write(KEYS.templates, read<ImportTemplate>(KEYS.templates).filter((t) => t.id !== templateId))
  }
}

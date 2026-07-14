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

export interface IRepository {
  getOrganization(orgId: string): Promise<Organization | null>
  createOrganization(data: Partial<Organization>): Promise<Organization>
  updateOrganization(orgId: string, data: Partial<Organization>): Promise<void>

  getBranches(orgId: string): Promise<Branch[]>
  createBranch(data: Partial<Branch>): Promise<Branch>
  updateBranch(branchId: string, data: Partial<Branch>): Promise<void>
  deleteBranch(branchId: string): Promise<void>

  getProfiles(orgId: string): Promise<Profile[]>
  createProfile(data: Partial<Profile>): Promise<Profile>
  updateProfile(profileId: string, data: Partial<Profile>): Promise<void>
  deleteProfile(profileId: string): Promise<void>

  getLocations(orgId: string, branchId?: string): Promise<Location[]>
  createLocation(data: Partial<Location>): Promise<Location>
  updateLocation(locationId: string, data: Partial<Location>): Promise<void>
  deleteLocation(locationId: string): Promise<void>

  getBrands(orgId: string, branchId?: string): Promise<Brand[]>
  createBrand(data: Partial<Brand>): Promise<Brand>
  updateBrand(brandId: string, data: Partial<Brand>): Promise<void>
  deleteBrand(brandId: string): Promise<void>

  getProducts(orgId: string, branchId?: string): Promise<ProductWithStock[]>
  getProduct(productId: string): Promise<ProductWithStock | null>
  createProduct(data: Partial<Product>): Promise<Product>
  updateProduct(productId: string, data: Partial<Product>): Promise<void>
  deleteProduct(productId: string): Promise<void>
  bulkCreateProducts(items: Partial<Product>[]): Promise<Product[]>

  getStockItems(productId: string): Promise<StockItem[]>
  createStockItem(data: Partial<StockItem>): Promise<StockItem>
  updateStockItem(stockId: string, data: Partial<StockItem>): Promise<void>
  deleteStockItem(stockId: string): Promise<void>
  bulkCreateStockItems(items: Partial<StockItem>[]): Promise<StockItem[]>

  getImportTemplates(orgId: string, branchId?: string): Promise<ImportTemplate[]>
  createImportTemplate(data: Partial<ImportTemplate>): Promise<ImportTemplate>
  updateImportTemplate(templateId: string, data: Partial<ImportTemplate>): Promise<void>
  deleteImportTemplate(templateId: string): Promise<void>
}

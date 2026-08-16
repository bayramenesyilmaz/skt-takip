import type { Brand, Product, StockItem, ProductWithStock } from '@/lib/types'

export interface IRepository {
  getBrands(): Promise<Brand[]>
  createBrand(data: Partial<Brand>): Promise<Brand>
  updateBrand(brandId: string, data: Partial<Brand>): Promise<void>
  deleteBrand(brandId: string): Promise<void>

  getProducts(): Promise<ProductWithStock[]>
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
}

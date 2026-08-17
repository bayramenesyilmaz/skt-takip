import type { Brand, Product, StockItem, ProductWithStock, Pallet, PalletItem, PalletWithItems, BackupData, RestoreResult } from '@/lib/types'

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

  getPallets(): Promise<PalletWithItems[]>
  getPallet(palletId: string): Promise<PalletWithItems | null>
  createPallet(data: Partial<Pallet>): Promise<Pallet>
  updatePallet(palletId: string, data: Partial<Pallet>): Promise<void>
  deletePallet(palletId: string): Promise<void>
  addPalletItem(data: { pallet_id: string; product_id: string; quantity?: number }): Promise<PalletItem>
  updatePalletItem(itemId: string, data: Partial<PalletItem>): Promise<void>
  removePalletItem(itemId: string): Promise<void>
  getPalletItemsForProduct(productId: string): Promise<(PalletItem & { pallet: Pallet })[]>

  exportBackup(): Promise<BackupData>
  restoreBackup(data: BackupData): Promise<RestoreResult>
}

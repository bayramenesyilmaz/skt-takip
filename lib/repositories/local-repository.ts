import type { IRepository } from '@/lib/repositories/repository.interface'
import type { Brand, Product, StockItem, ProductWithStock } from '@/lib/types'

const KEYS = {
  brands: 'skt-local-brands',
  products: 'skt-local-products',
  stock: 'skt-local-stock',
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
  async getBrands(): Promise<Brand[]> {
    return read<Brand>(KEYS.brands).sort((a, b) => a.name.localeCompare(b.name))
  }

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const brand: Brand = { id: uid(), name: data.name || '', return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }
    const brands = read<Brand>(KEYS.brands); brands.push(brand); write(KEYS.brands, brands); return brand
  }

  async updateBrand(brandId: string, data: Partial<Brand>): Promise<void> {
    const brands = read<Brand>(KEYS.brands); const idx = brands.findIndex((b) => b.id === brandId)
    if (idx >= 0) { brands[idx] = { ...brands[idx], ...data, updated_at: now() }; write(KEYS.brands, brands) }
  }

  async deleteBrand(brandId: string): Promise<void> {
    write(KEYS.brands, read<Brand>(KEYS.brands).filter((b) => b.id !== brandId))
  }

  async getProducts(): Promise<ProductWithStock[]> {
    const products = read<Product>(KEYS.products)
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
    const product: Product = { id: uid(), name: data.name || '', stock_code: data.stock_code, barcode: data.barcode, brand_id: data.brand_id, return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }
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
    const newProducts: Product[] = items.map((data) => ({ id: uid(), name: data.name || '', stock_code: data.stock_code, barcode: data.barcode, brand_id: data.brand_id, return_accepts: data.return_accepts ?? true, created_at: now(), updated_at: now() }))
    write(KEYS.products, [...products, ...newProducts]); return newProducts
  }

  async getStockItems(productId: string): Promise<StockItem[]> {
    return read<StockItem>(KEYS.stock).filter((s) => s.product_id === productId).sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
  }

  async createStockItem(data: Partial<StockItem>): Promise<StockItem> {
    const item: StockItem = { id: uid(), product_id: data.product_id || '', expiry_date: data.expiry_date || now(), quantity: data.quantity ?? 1, created_at: now(), updated_at: now() }
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
    const newItems: StockItem[] = items.map((data) => ({ id: uid(), product_id: data.product_id || '', expiry_date: data.expiry_date || now(), quantity: data.quantity ?? 1, created_at: now(), updated_at: now() }))
    write(KEYS.stock, [...stock, ...newItems]); return newItems
  }
}

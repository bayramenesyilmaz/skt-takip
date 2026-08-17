import type { IRepository } from '@/lib/repositories/repository.interface'
import type { Brand, Product, StockItem, ProductWithStock, Pallet, PalletItem, PalletWithItems, BackupData, RestoreResult } from '@/lib/types'

const KEYS = {
  brands: 'skt-local-brands',
  products: 'skt-local-products',
  stock: 'skt-local-stock',
  pallets: 'skt-local-pallets',
  palletItems: 'skt-local-pallet-items',
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

  async getPallets(): Promise<PalletWithItems[]> {
    const pallets = read<Pallet>(KEYS.pallets)
    const items = read<PalletItem>(KEYS.palletItems)
    const products = read<Product>(KEYS.products)
    return pallets
      .map((pl) => ({
        ...pl,
        items: items.filter((i) => i.pallet_id === pl.id).map((i) => ({ ...i, product: products.find((p) => p.id === i.product_id) })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async getPallet(palletId: string): Promise<PalletWithItems | null> {
    const pallet = read<Pallet>(KEYS.pallets).find((p) => p.id === palletId)
    if (!pallet) return null
    const items = read<PalletItem>(KEYS.palletItems).filter((i) => i.pallet_id === palletId)
    const products = read<Product>(KEYS.products)
    return { ...pallet, items: items.map((i) => ({ ...i, product: products.find((p) => p.id === i.product_id) })) }
  }

  async createPallet(data: Partial<Pallet>): Promise<Pallet> {
    const pallet: Pallet = { id: uid(), name: data.name || '', created_at: now(), updated_at: now() }
    const pallets = read<Pallet>(KEYS.pallets); pallets.push(pallet); write(KEYS.pallets, pallets); return pallet
  }

  async updatePallet(palletId: string, data: Partial<Pallet>): Promise<void> {
    const pallets = read<Pallet>(KEYS.pallets); const idx = pallets.findIndex((p) => p.id === palletId)
    if (idx >= 0) { pallets[idx] = { ...pallets[idx], ...data, updated_at: now() }; write(KEYS.pallets, pallets) }
  }

  async deletePallet(palletId: string): Promise<void> {
    write(KEYS.pallets, read<Pallet>(KEYS.pallets).filter((p) => p.id !== palletId))
    write(KEYS.palletItems, read<PalletItem>(KEYS.palletItems).filter((i) => i.pallet_id !== palletId))
  }

  async addPalletItem(data: { pallet_id: string; product_id: string; quantity?: number }): Promise<PalletItem> {
    const items = read<PalletItem>(KEYS.palletItems)
    const existing = items.find((i) => i.pallet_id === data.pallet_id && i.product_id === data.product_id)
    if (existing) {
      existing.quantity += data.quantity ?? 1
      existing.updated_at = now()
      write(KEYS.palletItems, items)
      return existing
    }
    const item: PalletItem = { id: uid(), pallet_id: data.pallet_id, product_id: data.product_id, quantity: data.quantity ?? 1, created_at: now(), updated_at: now() }
    items.push(item); write(KEYS.palletItems, items); return item
  }

  async updatePalletItem(itemId: string, data: Partial<PalletItem>): Promise<void> {
    const items = read<PalletItem>(KEYS.palletItems); const idx = items.findIndex((i) => i.id === itemId)
    if (idx >= 0) { items[idx] = { ...items[idx], ...data, updated_at: now() }; write(KEYS.palletItems, items) }
  }

  async removePalletItem(itemId: string): Promise<void> {
    write(KEYS.palletItems, read<PalletItem>(KEYS.palletItems).filter((i) => i.id !== itemId))
  }

  async getPalletItemsForProduct(productId: string): Promise<(PalletItem & { pallet: Pallet })[]> {
    const items = read<PalletItem>(KEYS.palletItems).filter((i) => i.product_id === productId && i.quantity > 0)
    const pallets = read<Pallet>(KEYS.pallets)
    return items
      .map((i) => ({ ...i, pallet: pallets.find((p) => p.id === i.pallet_id) }))
      .filter((i): i is PalletItem & { pallet: Pallet } => !!i.pallet)
  }

  async exportBackup(): Promise<BackupData> {
    const brands = read<Brand>(KEYS.brands)
    const products = read<Product>(KEYS.products)
    const stock = read<StockItem>(KEYS.stock)
    const pallets = read<Pallet>(KEYS.pallets)
    const palletItems = read<PalletItem>(KEYS.palletItems)
    return {
      app: 'skt-takip',
      schema: 1,
      exportedAt: now(),
      brands,
      products: products.map((p) => ({ ...p, stock_items: stock.filter((s) => s.product_id === p.id) })),
      pallets: pallets.map((pl) => ({ ...pl, items: palletItems.filter((i) => i.pallet_id === pl.id) })),
    }
  }

  async restoreBackup(data: BackupData): Promise<RestoreResult> {
    const result: RestoreResult = { brandsAdded: 0, productsAdded: 0, stockItemsAdded: 0, palletsAdded: 0, palletItemsAdded: 0 }

    const brands = read<Brand>(KEYS.brands)
    const brandIds = new Set(brands.map((b) => b.id))
    for (const b of data.brands || []) {
      if (!brandIds.has(b.id)) { brands.push(b); brandIds.add(b.id); result.brandsAdded++ }
    }
    write(KEYS.brands, brands)

    const products = read<Product>(KEYS.products)
    const productIds = new Set(products.map((p) => p.id))
    const stock = read<StockItem>(KEYS.stock)
    const stockIds = new Set(stock.map((s) => s.id))
    for (const p of data.products || []) {
      const { stock_items, ...productFields } = p
      if (!productIds.has(p.id)) { products.push(productFields); productIds.add(p.id); result.productsAdded++ }
      for (const s of stock_items || []) {
        if (!stockIds.has(s.id)) { stock.push(s); stockIds.add(s.id); result.stockItemsAdded++ }
      }
    }
    write(KEYS.products, products)
    write(KEYS.stock, stock)

    const pallets = read<Pallet>(KEYS.pallets)
    const palletIds = new Set(pallets.map((pl) => pl.id))
    const palletItems = read<PalletItem>(KEYS.palletItems)
    const palletItemIds = new Set(palletItems.map((i) => i.id))
    for (const pl of data.pallets || []) {
      const { items, ...palletFields } = pl
      if (!palletIds.has(pl.id)) { pallets.push(palletFields); palletIds.add(pl.id); result.palletsAdded++ }
      for (const i of items || []) {
        if (!palletItemIds.has(i.id)) { palletItems.push(i); palletItemIds.add(i.id); result.palletItemsAdded++ }
      }
    }
    write(KEYS.pallets, pallets)
    write(KEYS.palletItems, palletItems)

    return result
  }
}

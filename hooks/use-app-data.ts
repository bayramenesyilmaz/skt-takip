'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRepository } from '@/lib/repositories/repository.factory'
import type { Product, Brand, StockItem, ProductWithStock, ParsedProduct } from '@/lib/types'

export function useAppData() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const repo = getRepository()
      const [prods, brnds] = await Promise.all([repo.getProducts(), repo.getBrands()])
      setProducts(prods)
      setBrands(brnds)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addProduct = useCallback(async (product: Partial<Product> & { expiryDate?: string }) => {
    const repo = getRepository()
    const { expiryDate, ...productData } = product
    const created = await repo.createProduct(productData)
    if (expiryDate) {
      await repo.createStockItem({ product_id: created.id, expiry_date: expiryDate, quantity: 1 })
    }
    await loadData()
    return created
  }, [loadData])

  const bulkAddProducts = useCallback(async (items: ParsedProduct[]) => {
    const repo = getRepository()
    const brandNameToId = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]))
    const created = await repo.bulkCreateProducts(items.map((item) => ({
      name: item.name,
      stock_code: item.stockCode || undefined,
      barcode: item.barcode || undefined,
      brand_id: item.brand ? brandNameToId.get(item.brand.toLowerCase()) : undefined,
    })))
    const stockItems = items
      .map((item, i) => ({ product_id: created[i].id, expiry_date: item.expiryDate, quantity: 1 }))
      .filter((s) => s.expiry_date)
    if (stockItems.length > 0) await repo.bulkCreateStockItems(stockItems)
    await loadData()
    return created
  }, [brands, loadData])

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    const repo = getRepository()
    await repo.updateProduct(productId, updates)
    await loadData()
  }, [loadData])

  const deleteProduct = useCallback(async (productId: string) => {
    const repo = getRepository()
    await repo.deleteProduct(productId)
    await loadData()
  }, [loadData])

  const addBrand = useCallback(async (brand: Partial<Brand>) => {
    const repo = getRepository()
    const created = await repo.createBrand(brand)
    await loadData()
    return created
  }, [loadData])

  const updateBrand = useCallback(async (brandId: string, updates: Partial<Brand>) => {
    const repo = getRepository()
    await repo.updateBrand(brandId, updates)
    await loadData()
  }, [loadData])

  const deleteBrand = useCallback(async (brandId: string) => {
    const repo = getRepository()
    await repo.deleteBrand(brandId)
    await loadData()
  }, [loadData])

  const addStockItem = useCallback(async (stock: Partial<StockItem>) => {
    const repo = getRepository()
    await repo.createStockItem(stock)
    await loadData()
  }, [loadData])

  const updateStockItem = useCallback(async (stockId: string, updates: Partial<StockItem>) => {
    const repo = getRepository()
    await repo.updateStockItem(stockId, updates)
    await loadData()
  }, [loadData])

  const deleteStockItem = useCallback(async (stockId: string) => {
    const repo = getRepository()
    await repo.deleteStockItem(stockId)
    await loadData()
  }, [loadData])

  return {
    products,
    brands,
    isLoading,
    addProduct, bulkAddProducts, updateProduct, deleteProduct,
    addBrand, updateBrand, deleteBrand,
    addStockItem, updateStockItem, deleteStockItem,
    reload: loadData,
  }
}

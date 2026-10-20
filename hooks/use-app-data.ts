'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRepository } from '@/lib/repositories/repository.factory'
import { CURRENT_REYON_KEY } from '@/lib/context/reyon-context'
import type { Product, Brand, StockItem, ProductWithStock, ParsedProduct, Pallet, PalletWithItems, ShelfLifeType, Reyon, ReturnRecord, ReturnRecordWithProduct } from '@/lib/types'

function getCurrentReyonId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem(CURRENT_REYON_KEY) || undefined
}

export function useAppData() {
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [pallets, setPallets] = useState<PalletWithItems[]>([])
  const [shelfLifeTypes, setShelfLifeTypes] = useState<ShelfLifeType[]>([])
  const [reyons, setReyons] = useState<Reyon[]>([])
  const [returnRecords, setReturnRecords] = useState<ReturnRecordWithProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const repo = getRepository()
      const [prods, brnds, plts, types, reyonList, returns] = await Promise.all([repo.getProducts(), repo.getBrands(), repo.getPallets(), repo.getShelfLifeTypes(), repo.getReyons(), repo.getReturnRecords()])
      setProducts(prods)
      setBrands(brnds)
      setPallets(plts)
      setShelfLifeTypes(types)
      setReyons(reyonList)
      setReturnRecords(returns)
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
    const created = await repo.createProduct({ reyon_id: getCurrentReyonId(), ...productData })
    if (expiryDate) {
      await repo.createStockItem({ product_id: created.id, expiry_date: expiryDate, quantity: 1 })
    }
    await loadData()
    return created
  }, [loadData])

  const bulkAddProducts = useCallback(async (items: ParsedProduct[]) => {
    const repo = getRepository()
    const brandNameToId = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]))
    const reyonId = getCurrentReyonId()
    const created = await repo.bulkCreateProducts(items.map((item) => ({
      name: item.name,
      stock_code: item.stockCode || undefined,
      barcode: item.barcode || undefined,
      brand_id: item.brand ? brandNameToId.get(item.brand.toLowerCase()) : undefined,
      reyon_id: reyonId,
    })))
    const stockItems = items
      .map((item, i) => ({ product_id: created[i].id, expiry_date: item.expiryDate, quantity: 1 }))
      .filter((s) => s.expiry_date)
    if (stockItems.length > 0) await repo.bulkCreateStockItems(stockItems)
    await loadData()
    return created
  }, [brands, loadData])

  const bulkImportCatalog = useCallback(async (items: ParsedProduct[]) => {
    const repo = getRepository()
    const reyonId = getCurrentReyonId()
    const brandNameToId = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]))
    for (const item of items) {
      const key = item.brand?.toLowerCase()
      if (key && !brandNameToId.has(key)) {
        const created = await repo.createBrand({ name: item.brand, return_accepts: true })
        brandNameToId.set(key, created.id)
      }
    }
    const created = await repo.bulkCreateProducts(items.map((item) => ({
      name: item.name,
      stock_code: item.stockCode || undefined,
      barcode: item.barcode || undefined,
      brand_id: item.brand ? brandNameToId.get(item.brand.toLowerCase()) : undefined,
      reyon_id: reyonId,
    })))
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

  const zeroProductStock = useCallback(async (productId: string) => {
    const repo = getRepository()
    await repo.clearProductStock(productId)
    await loadData()
  }, [loadData])

  const addPallet = useCallback(async (data: Partial<Pallet>) => {
    const repo = getRepository()
    const created = await repo.createPallet(data)
    await loadData()
    return created
  }, [loadData])

  const deletePallet = useCallback(async (palletId: string) => {
    const repo = getRepository()
    await repo.deletePallet(palletId)
    await loadData()
  }, [loadData])

  const addPalletItem = useCallback(async (data: { pallet_id: string; product_id: string; quantity?: number }) => {
    const repo = getRepository()
    const item = await repo.addPalletItem(data)
    await loadData()
    return item
  }, [loadData])

  const removePalletItem = useCallback(async (itemId: string) => {
    const repo = getRepository()
    await repo.removePalletItem(itemId)
    await loadData()
  }, [loadData])

  const addShelfLifeType = useCallback(async (data: Partial<ShelfLifeType>) => {
    const repo = getRepository()
    const created = await repo.createShelfLifeType(data)
    await loadData()
    return created
  }, [loadData])

  const updateShelfLifeType = useCallback(async (id: string, updates: Partial<ShelfLifeType>) => {
    const repo = getRepository()
    await repo.updateShelfLifeType(id, updates)
    await loadData()
  }, [loadData])

  const deleteShelfLifeType = useCallback(async (id: string) => {
    const repo = getRepository()
    await repo.deleteShelfLifeType(id)
    await loadData()
  }, [loadData])

  const bulkAssignShelfLifeType = useCallback(async (productIds: string[], shelfLifeTypeId: string | undefined) => {
    const repo = getRepository()
    for (const id of productIds) {
      await repo.updateProduct(id, { shelf_life_type_id: shelfLifeTypeId })
    }
    await loadData()
  }, [loadData])

  const addReyon = useCallback(async (data: Partial<Reyon>) => {
    const repo = getRepository()
    const created = await repo.createReyon(data)
    await loadData()
    return created
  }, [loadData])

  const updateReyon = useCallback(async (id: string, updates: Partial<Reyon>) => {
    const repo = getRepository()
    await repo.updateReyon(id, updates)
    await loadData()
  }, [loadData])

  const deleteReyon = useCallback(async (id: string) => {
    const repo = getRepository()
    await repo.deleteReyon(id)
    await loadData()
  }, [loadData])

  const addReturnRecord = useCallback(async (data: Partial<ReturnRecord>) => {
    const repo = getRepository()
    const created = await repo.createReturnRecord(data)
    await loadData()
    return created
  }, [loadData])

  const updateReturnRecord = useCallback(async (id: string, data: Partial<ReturnRecord>) => {
    const repo = getRepository()
    await repo.updateReturnRecord(id, data)
    await loadData()
  }, [loadData])

  const deleteReturnRecord = useCallback(async (id: string) => {
    const repo = getRepository()
    await repo.deleteReturnRecord(id)
    await loadData()
  }, [loadData])

  const bulkDeleteReturnRecords = useCallback(async (ids: string[]) => {
    const repo = getRepository()
    await repo.bulkDeleteReturnRecords(ids)
    await loadData()
  }, [loadData])

  return {
    products,
    brands,
    pallets,
    shelfLifeTypes,
    reyons,
    returnRecords,
    isLoading,
    addProduct, bulkAddProducts, bulkImportCatalog, updateProduct, deleteProduct, zeroProductStock,
    addBrand, updateBrand, deleteBrand,
    addStockItem, updateStockItem, deleteStockItem,
    addPallet, deletePallet, addPalletItem, removePalletItem,
    addShelfLifeType, updateShelfLifeType, deleteShelfLifeType, bulkAssignShelfLifeType,
    addReyon, updateReyon, deleteReyon,
    addReturnRecord, updateReturnRecord, deleteReturnRecord, bulkDeleteReturnRecords,
    reload: loadData,
  }
}

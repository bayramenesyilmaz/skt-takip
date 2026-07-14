'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { getRepository, getStorageMode } from '@/lib/repositories/repository.factory'
import type { Product, Location, Brand, StockItem, ProductWithStock } from '@/lib/types'

export function useAppData() {
  const { profile, organization } = useAuth()
  const storageMode = getStorageMode()
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const orgId = organization?.id || 'local'
  const branchId = profile?.branch_id

  const loadData = useCallback(async () => {
    if (!orgId) return
    setIsLoading(true)
    try {
      const repo = getRepository()
      const [prods, locs, brnds] = await Promise.all([
        repo.getProducts(orgId, branchId),
        repo.getLocations(orgId, branchId),
        repo.getBrands(orgId, branchId),
      ])
      setProducts(prods)
      setLocations(locs)
      setBrands(brnds)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [orgId, branchId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addProduct = useCallback(
    async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const repo = getRepository()
      await repo.createProduct({
        ...product,
        org_id: orgId,
        branch_id: branchId,
      })
      if (product.expiryDate) {
        const created = await repo.getProducts(orgId, branchId)
        const newProduct = created[created.length - 1]
        if (newProduct) {
          await repo.createStockItem({
            org_id: orgId,
            branch_id: branchId,
            product_id: newProduct.id,
            expiry_date: product.expiryDate,
            quantity: 1,
          })
        }
      }
      loadData()
    },
    [orgId, branchId, loadData],
  )

  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      const repo = getRepository()
      await repo.updateProduct(productId, updates)
      loadData()
    },
    [loadData],
  )

  const deleteProduct = useCallback(
    async (productId: string) => {
      const repo = getRepository()
      await repo.deleteProduct(productId)
      loadData()
    },
    [loadData],
  )

  const addLocation = useCallback(
    async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
      const repo = getRepository()
      await repo.createLocation({
        ...location,
        org_id: orgId,
        branch_id: branchId,
      })
      loadData()
    },
    [orgId, branchId, loadData],
  )

  const deleteLocation = useCallback(
    async (locationId: string) => {
      const repo = getRepository()
      await repo.deleteLocation(locationId)
      loadData()
    },
    [loadData],
  )

  const addBrand = useCallback(
    async (brand: Omit<Brand, 'id' | 'created_at' | 'updated_at'>) => {
      const repo = getRepository()
      await repo.createBrand({
        ...brand,
        org_id: orgId,
        branch_id: branchId,
      })
      loadData()
    },
    [orgId, branchId, loadData],
  )

  const updateBrand = useCallback(
    async (brandId: string, updates: Partial<Brand>) => {
      const repo = getRepository()
      await repo.updateBrand(brandId, updates)
      loadData()
    },
    [loadData],
  )

  const deleteBrand = useCallback(
    async (brandId: string) => {
      const repo = getRepository()
      await repo.deleteBrand(brandId)
      loadData()
    },
    [loadData],
  )

  const addStockItem = useCallback(
    async (stock: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>) => {
      const repo = getRepository()
      await repo.createStockItem({
        ...stock,
        org_id: orgId,
        branch_id: branchId,
      })
      loadData()
    },
    [orgId, branchId, loadData],
  )

  const updateStockItem = useCallback(
    async (stockId: string, updates: Partial<StockItem>) => {
      const repo = getRepository()
      await repo.updateStockItem(stockId, updates)
      loadData()
    },
    [loadData],
  )

  const deleteStockItem = useCallback(
    async (stockId: string) => {
      const repo = getRepository()
      await repo.deleteStockItem(stockId)
      loadData()
    },
    [loadData],
  )

  return {
    products,
    locations,
    brands,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addLocation,
    deleteLocation,
    addBrand,
    updateBrand,
    deleteBrand,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    reload: loadData,
  }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { getRepository, getStorageMode } from '@/lib/repositories/repository.factory'
import { supabase } from '@/lib/supabase/client'
import type { Product, Location, Brand, StockItem, ProductWithStock, ProfileLocation } from '@/lib/types'

export function useAppData() {
  const { profile, organization } = useAuth()
  const storageMode = getStorageMode()
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [assignedLocationIds, setAssignedLocationIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const orgId = organization?.id || 'local'
  const branchId = profile?.branch_id
  const isStaff = profile?.role === 'staff'
  const canSeeAll = !isStaff || storageMode === 'local'

  const loadAssignedLocations = useCallback(async () => {
    if (storageMode === 'local' || !profile) return
    if (!isStaff) return
    try {
      const { data, error } = await supabase
        .from('profile_locations')
        .select('location_id')
        .eq('profile_id', profile.id)
      if (error) throw error
      if (data) {
        setAssignedLocationIds(new Set(data.map((pl: ProfileLocation) => pl.location_id)))
      }
    } catch (err) {
      console.error('Failed to load assigned locations:', err)
    }
  }, [profile, isStaff, storageMode])

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
    loadAssignedLocations()
  }, [loadData, loadAssignedLocations])

  // Filter products for staff: only show products that have stock in their assigned locations
  // or products with no location assignment
  const visibleProducts = canSeeAll ? products : products.filter((p) => {
    if (assignedLocationIds.size === 0) return true
    return p.stock_items?.some((s) => s.location_id && assignedLocationIds.has(s.location_id))
  })

  const addProduct = useCallback(async (product: Partial<Product> & { expiryDate?: string }) => {
    const repo = getRepository()
    const { expiryDate, ...productData } = product
    const created = await repo.createProduct({ ...productData, org_id: orgId, branch_id: branchId })
    if (expiryDate) {
      await repo.createStockItem({ org_id: orgId, branch_id: branchId, product_id: created.id, expiry_date: expiryDate, quantity: 1 } as any)
    }
    loadData()
  }, [orgId, branchId, loadData])

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    const repo = getRepository()
    await repo.updateProduct(productId, updates)
    loadData()
  }, [loadData])

  const deleteProduct = useCallback(async (productId: string) => {
    const repo = getRepository()
    await repo.deleteProduct(productId)
    loadData()
  }, [loadData])

  const addLocation = useCallback(async (location: Partial<Location>) => {
    const repo = getRepository()
    await repo.createLocation({ ...location, org_id: orgId, branch_id: branchId } as any)
    loadData()
  }, [orgId, branchId, loadData])

  const deleteLocation = useCallback(async (locationId: string) => {
    const repo = getRepository()
    await repo.deleteLocation(locationId)
    loadData()
  }, [loadData])

  const addBrand = useCallback(async (brand: Partial<Brand>) => {
    const repo = getRepository()
    await repo.createBrand({ ...brand, org_id: orgId, branch_id: branchId } as any)
    loadData()
  }, [orgId, branchId, loadData])

  const updateBrand = useCallback(async (brandId: string, updates: Partial<Brand>) => {
    const repo = getRepository()
    await repo.updateBrand(brandId, updates)
    loadData()
  }, [loadData])

  const deleteBrand = useCallback(async (brandId: string) => {
    const repo = getRepository()
    await repo.deleteBrand(brandId)
    loadData()
  }, [loadData])

  const addStockItem = useCallback(async (stock: Partial<StockItem>) => {
    const repo = getRepository()
    await repo.createStockItem({ ...stock, org_id: orgId, branch_id: branchId } as any)
    loadData()
  }, [orgId, branchId, loadData])

  const updateStockItem = useCallback(async (stockId: string, updates: Partial<StockItem>) => {
    const repo = getRepository()
    await repo.updateStockItem(stockId, updates)
    loadData()
  }, [loadData])

  const deleteStockItem = useCallback(async (stockId: string) => {
    const repo = getRepository()
    await repo.deleteStockItem(stockId)
    loadData()
  }, [loadData])

  const assignLocationToProfile = useCallback(async (profileId: string, locationId: string) => {
    if (storageMode === 'local') return
    try {
      await supabase.from('profile_locations').insert({ profile_id: profileId, location_id: locationId })
      loadAssignedLocations()
    } catch (err) {
      console.error('Failed to assign location:', err)
    }
  }, [storageMode, loadAssignedLocations])

  const unassignLocationFromProfile = useCallback(async (profileId: string, locationId: string) => {
    if (storageMode === 'local') return
    try {
      await supabase.from('profile_locations').delete().eq('profile_id', profileId).eq('location_id', locationId)
      loadAssignedLocations()
    } catch (err) {
      console.error('Failed to unassign location:', err)
    }
  }, [storageMode, loadAssignedLocations])

  return {
    products: visibleProducts,
    allProducts: products,
    locations,
    brands,
    assignedLocationIds,
    isLoading,
    addProduct, updateProduct, deleteProduct,
    addLocation, deleteLocation,
    addBrand, updateBrand, deleteBrand,
    addStockItem, updateStockItem, deleteStockItem,
    assignLocationToProfile, unassignLocationFromProfile,
    reload: loadData,
  }
}

"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Product, Location, ExpiryInfo, ExpiryStatus, ParsedProduct } from '@/lib/types'

const PRODUCTS_KEY = 'skt-takip-products'
const LOCATIONS_KEY = 'skt-takip-locations'

// SSR-safe localStorage helpers
function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export function getExpiryInfo(expiryDate: string): ExpiryInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let status: ExpiryStatus
  let label: string
  let actionRequired: string
  
  if (daysLeft < 0) {
    status = 'expired'
    label = `${Math.abs(daysLeft)} gun gecmis`
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Bugun son gun!'
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft <= 3) {
    status = 'critical'
    label = `${daysLeft} gun kaldi`
    actionRequired = 'ACIL: Raftan kaldir!'
  } else if (daysLeft <= 14) {
    status = 'remove'
    label = `${daysLeft} gun kaldi`
    actionRequired = 'Raftan kaldirmalisin'
  } else if (daysLeft <= 90) {
    status = 'campaign'
    label = `${daysLeft} gun kaldi`
    actionRequired = 'Yetkiliye bildir - Kampanya onerisi'
  } else {
    status = 'safe'
    label = `${daysLeft} gun kaldi`
    actionRequired = 'Guvenli'
  }
  
  return { status, daysLeft, label, actionRequired }
}

// WhatsApp formatindan urunleri ayristir
export function parseProductsFromText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = []
  const lines = text.split(/\n/).filter(line => line.trim())
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Tarih formatini bul: DD/MM/YYYY
    const dateMatch = trimmedLine.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    
    if (dateMatch) {
      const [fullMatch, day, month, year] = dateMatch
      const namePart = trimmedLine.substring(0, trimmedLine.indexOf(fullMatch))
      const name = namePart.replace(/\s*-\s*$/, '').trim()
      
      if (name) {
        const expiryDate = `${year}-${month}-${day}`
        const dateObj = new Date(expiryDate)
        const isValidDate = !isNaN(dateObj.getTime())
        
        products.push({
          name,
          expiryDate,
          isValid: isValidDate,
          error: isValidDate ? undefined : 'Gecersiz tarih'
        })
      }
    }
  }
  
  return products
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Load data from localStorage
  useEffect(() => {
    if (!isMounted) return
    
    try {
      const storedProducts = getStorageItem(PRODUCTS_KEY)
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts)
        if (Array.isArray(parsed)) {
          setProducts(parsed)
        }
      }
      
      const storedLocations = getStorageItem(LOCATIONS_KEY)
      if (storedLocations) {
        const parsed = JSON.parse(storedLocations)
        if (Array.isArray(parsed)) {
          setLocations(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isMounted])
  
  // Save products
  const saveProducts = useCallback((newProducts: Product[]) => {
    setStorageItem(PRODUCTS_KEY, JSON.stringify(newProducts))
    setProducts(newProducts)
  }, [])
  
  // Save locations
  const saveLocations = useCallback((newLocations: Location[]) => {
    setStorageItem(LOCATIONS_KEY, JSON.stringify(newLocations))
    setLocations(newLocations)
  }, [])
  
  // Product operations
  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveProducts([...products, newProduct])
    return newProduct
  }, [products, saveProducts])
  
  const addBulkProducts = useCallback((parsedProducts: ParsedProduct[], locationId?: string) => {
    const validProducts = parsedProducts.filter(p => p.isValid)
    const newProducts: Product[] = validProducts.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      expiryDate: p.expiryDate,
      locationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
    
    saveProducts([...products, ...newProducts])
    return newProducts
  }, [products, saveProducts])
  
  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    const updated = products.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    )
    saveProducts(updated)
  }, [products, saveProducts])
  
  const deleteProduct = useCallback((id: string) => {
    saveProducts(products.filter(p => p.id !== id))
  }, [products, saveProducts])

  const reduceProductToZero = useCallback((id: string) => {
    const updated = products.map(p => 
      p.id === id 
        ? { ...p, stockCode: '0', updatedAt: new Date().toISOString() }
        : p
    )
    saveProducts(updated)
  }, [products, saveProducts])
  
  const clearAllProducts = useCallback(() => {
    saveProducts([])
  }, [saveProducts])
  
  // Location operations
  const addLocation = useCallback((location: Omit<Location, 'id' | 'createdAt'>) => {
    const newLocation: Location = {
      ...location,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    saveLocations([...locations, newLocation])
    return newLocation
  }, [locations, saveLocations])
  
  const updateLocation = useCallback((id: string, updates: Partial<Omit<Location, 'id' | 'createdAt'>>) => {
    const updated = locations.map(l => 
      l.id === id ? { ...l, ...updates } : l
    )
    saveLocations(updated)
  }, [locations, saveLocations])
  
  const deleteLocation = useCallback((id: string) => {
    // Lokasyon silinince urunlerin locationId'sini temizle
    const updatedProducts = products.map(p => 
      p.locationId === id ? { ...p, locationId: undefined } : p
    )
    saveProducts(updatedProducts)
    saveLocations(locations.filter(l => l.id !== id))
  }, [locations, products, saveLocations, saveProducts])
  
  // Helper functions
  const getProductsByStatus = useCallback((status: ExpiryStatus) => {
    return products.filter(p => getExpiryInfo(p.expiryDate).status === status)
  }, [products])
  
  const getSortedProducts = useCallback(() => {
    return [...products].sort((a, b) => {
      const aInfo = getExpiryInfo(a.expiryDate)
      const bInfo = getExpiryInfo(b.expiryDate)
      return aInfo.daysLeft - bInfo.daysLeft
    })
  }, [products])
  
  const searchProducts = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.stockCode && p.stockCode.toLowerCase().includes(lowerQuery)) ||
      (p.barcode && p.barcode.includes(lowerQuery))
    )
  }, [products])
  
  const getProductsByLocation = useCallback((locationId: string) => {
    return products.filter(p => p.locationId === locationId)
  }, [products])
  
  const getLocationName = useCallback((locationId: string | undefined) => {
    if (!locationId) return null
    return locations.find(l => l.id === locationId)?.name || null
  }, [locations])
  
  const getProductLocations = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product?.locationId) return []
    const location = locations.find(l => l.id === product.locationId)
    return location ? [location] : []
  }, [products, locations])
  
  // Urun ara - stok kodu veya barkod ile
  const findProductLocations = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    const matchingProducts = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.stockCode && p.stockCode.toLowerCase().includes(lowerQuery)) ||
      (p.barcode && p.barcode.includes(lowerQuery))
    )
    
    return matchingProducts.map(product => ({
      product,
      location: product.locationId ? locations.find(l => l.id === product.locationId) : undefined
    }))
  }, [products, locations])
  
  return {
    products,
    locations,
    isLoading,
    // Product operations
    addProduct,
    addBulkProducts,
    updateProduct,
    deleteProduct,
    reduceProductToZero,
    clearAllProducts,
    // Location operations
    addLocation,
    updateLocation,
    deleteLocation,
    // Helpers
    getProductsByStatus,
    getSortedProducts,
    searchProducts,
    getProductsByLocation,
    getLocationName,
    getProductLocations,
    findProductLocations,
  }
}

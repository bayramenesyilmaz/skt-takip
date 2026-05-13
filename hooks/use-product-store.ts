"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Product, ExpiryInfo, ExpiryStatus, ParsedProduct, ProductType, AppSettings } from '@/lib/types'

const PRODUCTS_KEY = 'skt-takip-products'
const SETTINGS_KEY = 'skt-takip-settings'

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

// Urun tipine gore farkli raf omru hesapla
export function getExpiryInfoByType(expiryDate: string, productType?: ProductType): ExpiryInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let status: ExpiryStatus
  let label: string
  let actionRequired: string
  
  // Urun tipine gore kritik gun sinirlari
  // fridge-4: 3 gun, processed: 5-10 gun, diger: 14 gun
  const criticalDays = productType === 'fridge-4' ? 3 : (productType === 'processed' ? 5 : 14)
  const removeDays = productType === 'fridge-4' ? 3 : (productType === 'processed' ? 10 : 14)
  const campaignDays = productType === 'fridge-4' ? 30 : (productType === 'processed' ? 60 : 90)
  
  if (daysLeft < 0) {
    status = 'expired'
    label = `${Math.abs(daysLeft)} gun gecmis`
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Bugun son gun!'
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft <= criticalDays) {
    status = 'critical'
    label = `${daysLeft} gun`
    actionRequired = 'ACIL: Raftan kaldir!'
  } else if (daysLeft <= removeDays) {
    status = 'remove'
    label = `${daysLeft} gun`
    actionRequired = 'Raftan kaldirmalisin'
  } else if (daysLeft <= campaignDays) {
    status = 'campaign'
    label = `${daysLeft} gun`
    actionRequired = 'Kampanya incele'
  } else {
    status = 'safe'
    label = `${daysLeft} gun`
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

const defaultSettings: AppSettings = {
  noReturnBrands: []
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
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
      
      const storedSettings = getStorageItem(SETTINGS_KEY)
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings)
        setSettings({ ...defaultSettings, ...parsed })
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
  
  // Save settings
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setStorageItem(SETTINGS_KEY, JSON.stringify(newSettings))
    setSettings(newSettings)
  }, [])
  
  // Product operations
  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      stockCode: product.stockCode || '1',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveProducts([...products, newProduct])
    return newProduct
  }, [products, saveProducts])
  
  const addBulkProducts = useCallback((parsedProducts: ParsedProduct[]) => {
    const validProducts = parsedProducts.filter(p => p.isValid)
    const newProducts: Product[] = validProducts.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      stockCode: '1',
      expiryDate: p.expiryDate,
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

  const setStockZero = useCallback((id: string) => {
    const updated = products.map(p => 
      p.id === id 
        ? { ...p, stockCode: '0', updatedAt: new Date().toISOString() }
        : p
    )
    saveProducts(updated)
  }, [products, saveProducts])

  const restoreProduct = useCallback((id: string) => {
    const updated = products.map(p => 
      p.id === id 
        ? { ...p, stockCode: '1', updatedAt: new Date().toISOString() }
        : p
    )
    saveProducts(updated)
  }, [products, saveProducts])
  
  const clearAllProducts = useCallback(() => {
    saveProducts([])
  }, [saveProducts])

  // Import/Export
  const exportProducts = useCallback(() => {
    return JSON.stringify(products, null, 2)
  }, [products])

  const importProducts = useCallback((jsonData: string) => {
    try {
      const imported = JSON.parse(jsonData)
      if (Array.isArray(imported)) {
        saveProducts(imported)
        return { success: true, count: imported.length }
      }
      return { success: false, error: 'Gecersiz format' }
    } catch {
      return { success: false, error: 'JSON parse hatasi' }
    }
  }, [saveProducts])

  // Settings operations
  const addNoReturnBrand = useCallback((brand: string) => {
    const newBrands = [...settings.noReturnBrands, brand.trim()]
    saveSettings({ ...settings, noReturnBrands: newBrands })
  }, [settings, saveSettings])

  const removeNoReturnBrand = useCallback((brand: string) => {
    const newBrands = settings.noReturnBrands.filter(b => b !== brand)
    saveSettings({ ...settings, noReturnBrands: newBrands })
  }, [settings, saveSettings])

  // Helper - aktif urunler (stok > 0)
  const activeProducts = products.filter(p => p.stockCode !== '0')
  
  // Helper - stok 0 urunler
  const zeroStockProducts = products.filter(p => p.stockCode === '0')
  
  const getBrands = useCallback(() => {
    return settings.allBrands || []
  }, [settings])

  const addBrand = useCallback((brand: string) => {
    if (!brand.trim()) return
    const allBrands = settings.allBrands || []
    if (!allBrands.includes(brand.trim())) {
      updateSettings({
        allBrands: [...allBrands, brand.trim()],
        noReturnBrands: settings.noReturnBrands
      })
    }
  }, [settings, updateSettings])

  const deleteBrand = useCallback((brand: string) => {
    const allBrands = (settings.allBrands || []).filter(b => b !== brand)
    const noReturn = settings.noReturnBrands.filter(b => b !== brand)
    updateSettings({
      allBrands,
      noReturnBrands: noReturn
    })
  }, [settings, updateSettings])

  const toggleBrandReturn = useCallback((brand: string) => {
    const noReturn = settings.noReturnBrands
    if (noReturn.includes(brand)) {
      updateSettings({
        allBrands: settings.allBrands,
        noReturnBrands: noReturn.filter(b => b !== brand)
      })
    } else {
      updateSettings({
        allBrands: settings.allBrands,
        noReturnBrands: [...noReturn, brand]
      })
    }
  }, [settings, updateSettings])

  return {
    products: activeProducts,
    zeroStockProducts,
    isLoading,
    activeProducts,
    settings,
    addProduct,
    updateProduct,
    setStockZero,
    restoreProduct,
    deleteProduct,
    updateSettings,
    getBrands,
    addBrand,
    deleteBrand,
    toggleBrandReturn,
    clearAllData,
    exportData,
    importData,
  }
}

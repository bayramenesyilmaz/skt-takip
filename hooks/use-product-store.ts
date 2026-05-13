"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Product, ExpiryInfo, ExpiryStatus, ParsedProduct, ProductType, AppSettings } from '@/lib/types'

const PRODUCTS_KEY = 'skt-takip-products'
const SETTINGS_KEY = 'skt-takip-settings'

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
    console.error('[v0] localStorage error:', error)
  }
}

export function getExpiryInfoByType(expiryDate: string, productType?: ProductType): ExpiryInfo {
  if (!expiryDate) {
    return {
      status: 'safe',
      daysLeft: 0,
      label: 'N/A',
      actionRequired: 'Tarih yok'
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const criticalDays = productType === 'fridge-4' ? 3 : (productType === 'processed' ? 5 : 14)
  const removeDays = productType === 'fridge-4' ? 3 : (productType === 'processed' ? 10 : 14)
  const campaignDays = productType === 'fridge-4' ? 30 : (productType === 'processed' ? 60 : 90)
  
  let status: ExpiryStatus = 'safe'
  let label = '?'
  let actionRequired = 'Guvenli'
  
  if (daysLeft < 0) {
    status = 'expired'
    label = `${Math.abs(daysLeft)} gun gecmis`
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Son gun!'
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft <= criticalDays) {
    status = 'critical'
    label = `${daysLeft} gun`
    actionRequired = 'ACIL!'
  } else if (daysLeft <= removeDays) {
    status = 'remove'
    label = `${daysLeft} gun`
    actionRequired = 'Yakinda'
  } else if (daysLeft <= campaignDays) {
    status = 'campaign'
    label = `${daysLeft} gun`
    actionRequired = 'Kampanya'
  } else {
    status = 'safe'
    label = `${daysLeft} gun`
    actionRequired = 'Guvenli'
  }
  
  return { status, daysLeft, label, actionRequired }
}

export function parseProductsFromText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = []
  const lines = text.split(/\n/).filter(line => line.trim())
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
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
  allBrands: [],
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
      console.error('[v0] Load error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isMounted])
  
  const saveProducts = useCallback((newProducts: Product[]) => {
    if (!Array.isArray(newProducts)) {
      console.warn('[v0] saveProducts: newProducts is not array', newProducts)
      return
    }
    setStorageItem(PRODUCTS_KEY, JSON.stringify(newProducts))
    setProducts(newProducts)
  }, [])
  
  const updateSettings = useCallback((newSettings: AppSettings) => {
    setStorageItem(SETTINGS_KEY, JSON.stringify(newSettings))
    setSettings(newSettings)
  }, [])
  
  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      stockCode: product.stockCode || '1',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveProducts([...products, newProduct])
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
    updateProduct(id, { stockCode: '0' })
  }, [updateProduct])

  const restoreProduct = useCallback((id: string) => {
    updateProduct(id, { stockCode: '1' })
  }, [updateProduct])
  
  const clearAllData = useCallback(() => {
    saveProducts([])
    updateSettings(defaultSettings)
  }, [saveProducts, updateSettings])

  const exportData = useCallback(() => {
    return JSON.stringify({ products, settings }, null, 2)
  }, [products, settings])

  const importData = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData)
      if (data.products && Array.isArray(data.products)) {
        saveProducts(data.products)
        if (data.settings) {
          updateSettings({ ...defaultSettings, ...data.settings })
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }, [saveProducts, updateSettings])

  const getBrands = useCallback(() => {
    return settings.allBrands || []
  }, [settings])

  const addBrand = useCallback((brand: string) => {
    if (!brand.trim()) return
    const allBrands = settings.allBrands || []
    if (!allBrands.includes(brand.trim())) {
      updateSettings({
        ...settings,
        allBrands: [...allBrands, brand.trim()]
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
        ...settings,
        noReturnBrands: noReturn.filter(b => b !== brand)
      })
    } else {
      updateSettings({
        ...settings,
        noReturnBrands: [...noReturn, brand]
      })
    }
  }, [settings, updateSettings])

  const activeProducts = products.filter(p => p.stockCode !== '0')
  const zeroStockProducts = products.filter(p => p.stockCode === '0')
  
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

"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Product, ExpiryInfo, ExpiryStatus, ParsedProduct } from '@/lib/types'

const STORAGE_KEY = 'skt-takip-products'

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
    label = `${Math.abs(daysLeft)} gün geçmiş`
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Bugün son gün!'
    actionRequired = 'HEMEN RAFTAN KALDIR!'
  } else if (daysLeft <= 3) {
    status = 'critical'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'ACİL: Raftan kaldır!'
  } else if (daysLeft <= 14) {
    status = 'remove'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Raftan kaldırılabilir'
  } else if (daysLeft <= 90) {
    status = 'campaign'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Yetkiliye bildir - Kampanya önerisi'
  } else {
    status = 'safe'
    label = `${daysLeft} gün kaldı`
    actionRequired = 'Güvenli'
  }
  
  return { status, daysLeft, label, actionRequired }
}

// WhatsApp formatından ürünleri ayrıştır
// Format: "Ürün adı - GG/AA/YYYY" veya "Ürün adı - GG/AA/YYYY\n"
export function parseProductsFromText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = []
  
  // Tarih formatı: DD/MM/YYYY
  const datePattern = /(\d{2})\/(\d{2})\/(\d{4})/g
  
  // Metni satırlara böl veya tarih paternine göre ayır
  const lines = text.split(/\n/).filter(line => line.trim())
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // Tarih formatını bul
    const dateMatch = trimmedLine.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    
    if (dateMatch) {
      const [fullMatch, day, month, year] = dateMatch
      
      // Ürün adını al (tarihten önceki kısım, " - " ile ayrılmış)
      const namePart = trimmedLine.substring(0, trimmedLine.indexOf(fullMatch))
      const name = namePart.replace(/\s*-\s*$/, '').trim()
      
      if (name) {
        // Tarihi ISO formatına çevir (YYYY-MM-DD)
        const expiryDate = `${year}-${month}-${day}`
        
        // Tarihin geçerli olup olmadığını kontrol et
        const dateObj = new Date(expiryDate)
        const isValidDate = !isNaN(dateObj.getTime())
        
        products.push({
          name,
          expiryDate,
          isValid: isValidDate,
          error: isValidDate ? undefined : 'Geçersiz tarih'
        })
      }
    }
  }
  
  return products
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
  // Mark as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Load products from localStorage
  useEffect(() => {
    if (!isMounted) return
    
    try {
      const stored = getStorageItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setProducts(parsed)
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isMounted])
  
  // Save products to localStorage
  const saveProducts = useCallback((newProducts: Product[]) => {
    setStorageItem(STORAGE_KEY, JSON.stringify(newProducts))
    setProducts(newProducts)
  }, [])
  
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
  
  // Toplu ürün ekleme fonksiyonu
  const addBulkProducts = useCallback((parsedProducts: ParsedProduct[]) => {
    const validProducts = parsedProducts.filter(p => p.isValid)
    const newProducts: Product[] = validProducts.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      stockCode: '', // Otomatik stok kodu atanacak
      barcode: '',
      expiryDate: p.expiryDate,
      category: 'general' as const,
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
  
  const clearAll = useCallback(() => {
    saveProducts([])
  }, [saveProducts])
  
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
      p.stockCode.toLowerCase().includes(lowerQuery) ||
      p.barcode.includes(lowerQuery)
    )
  }, [products])
  
  return {
    products,
    isLoading,
    addProduct,
    addBulkProducts,
    updateProduct,
    deleteProduct,
    clearAll,
    getProductsByStatus,
    getSortedProducts,
    searchProducts,
  }
}

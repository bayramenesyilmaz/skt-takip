"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Product, ExpiryInfo, ExpiryStatus } from '@/lib/types'

const STORAGE_KEY = 'skt-takip-products'

export function getExpiryInfo(expiryDate: string): ExpiryInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let status: ExpiryStatus
  let label: string
  
  if (daysLeft < 0) {
    status = 'expired'
    label = `${Math.abs(daysLeft)} gün geçmiş`
  } else if (daysLeft === 0) {
    status = 'expired'
    label = 'Bugün son gün!'
  } else if (daysLeft <= 7) {
    status = 'critical'
    label = `${daysLeft} gün kaldı`
  } else if (daysLeft <= 30) {
    status = 'warning'
    label = `${daysLeft} gün kaldı`
  } else {
    status = 'safe'
    label = `${daysLeft} gün kaldı`
  }
  
  return { status, daysLeft, label }
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Load products from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setProducts(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Save products to localStorage
  const saveProducts = useCallback((newProducts: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts))
      setProducts(newProducts)
    } catch (error) {
      console.error('Failed to save products:', error)
    }
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
    updateProduct,
    deleteProduct,
    getProductsByStatus,
    getSortedProducts,
    searchProducts,
  }
}

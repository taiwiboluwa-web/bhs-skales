import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Product } from '@/lib/supabase'

export type CartItem = Product & { quantity: number }

type CartContextType = {
  cartItems: CartItem[]
  addToCart: (p: Product) => void
  clearCart: () => void
  cartOpen: boolean
  setCartOpen: (v: boolean) => void
  removeItem: (id: any) => void
  updateQuantity: (id: any, qty: number) => void
  subtotal: number
  totalCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const raw = localStorage.getItem('shins_cart')
      return raw ? JSON.parse(raw) as CartItem[] : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('shins_cart', JSON.stringify(cartItems))
    } catch {
      // ignore
    }
  }, [cartItems])

  const addToCart = useCallback((p: Product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === (p as any).id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 1) + 1 }
        return copy
      }
      return [...prev, { ...(p as Product), quantity: 1 }]
    })
    // do not auto-open drawer
  }, [])

  const removeItem = useCallback((id: any) => setCartItems(prev => prev.filter(i => i.id !== id)), [])

  const updateQuantity = useCallback((id: any, qty: number) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)), [])

  const clearCart = useCallback(() => setCartItems([]), [])

  const subtotal = cartItems.reduce((acc, it) => acc + (Number((it as any).price) || 0) * (it.quantity || 1), 0)
  const totalCount = cartItems.reduce((acc, it) => acc + (it.quantity || 0), 0)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, clearCart, cartOpen, setCartOpen, removeItem, updateQuantity, subtotal, totalCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartContext

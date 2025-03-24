import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '../types/cart'
import toast from 'react-hot-toast'

interface CartStore {
  cart: Cart
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

const initialState: Cart = {
  items: [],
  total: 0,
  itemCount: 0
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: initialState,
      
      addItem: (item) => set((state) => {
        const existingItem = state.cart.items.find((i) => i.id === item.id)
        
        if (existingItem) {
          const updatedItems = state.cart.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
          
          toast.success('Cantidad actualizada en el carrito')
          return {
            cart: {
              items: updatedItems,
              total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
              itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
            }
          }
        }
        
        const newItem = { ...item, quantity: 1 }
        const updatedItems = [...state.cart.items, newItem]
        
        toast.success('Producto añadido al carrito')
        return {
          cart: {
            items: updatedItems,
            total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
          }
        }
      }),
      
      removeItem: (itemId) => set((state) => {
        const updatedItems = state.cart.items.filter((i) => i.id !== itemId)
        
        toast.success('Producto eliminado del carrito')
        return {
          cart: {
            items: updatedItems,
            total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
          }
        }
      }),
      
      updateQuantity: (itemId, quantity) => set((state) => {
        if (quantity < 1) {
          const updatedItems = state.cart.items.filter((i) => i.id !== itemId)
          
          toast.success('Producto eliminado del carrito')
          return {
            cart: {
              items: updatedItems,
              total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
              itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
            }
          }
        }
        
        const updatedItems = state.cart.items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        )
        
        toast.success('Cantidad actualizada en el carrito')
        return {
          cart: {
            items: updatedItems,
            total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
          }
        }
      }),
      
      clearCart: () => {
        toast.success('Carrito vaciado')
        return set({ cart: initialState })
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)
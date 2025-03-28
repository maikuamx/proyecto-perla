/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem } from '../types/cart'
import toast from 'react-hot-toast'
import { getSupabaseClient } from '../lib/supabase'


interface CartStore {
  cart: Cart
  addItem: (item: Omit<CartItem, 'quantity'>) => Promise<void>
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => void
}

const initialState: Cart = {
  items: [],
  total: 0,
  itemCount: 0
}
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: initialState,

      addItem: async (item) => {
        console.log('🛒 Intentando agregar producto al carrito:', item);
        

        try {
          const supabase = getSupabaseClient();
          console.log('✅ Supabase client obtenido:', supabase);

          // Verificar stock del producto
          console.log('🔍 Consultando stock en Supabase para producto:', item.id);
          const { data: product, error } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.id)
            .single();

          console.log('📡 Respuesta de Supabase:', product, error);

          if (error) {
            console.error('❌ Error verificando stock:', error);
            toast.error('Error al verificar disponibilidad');
            return;
          }

          if (!product) {
            console.warn('⚠️ Producto no encontrado en la base de datos:', item.id);
            toast.error('Producto no encontrado');
            return;
          }

          const currentCart = get().cart;
          console.log('🛒 Estado actual del carrito:', currentCart);

          const existingItem = currentCart.items.find(i => i.id === item.id);

          if (existingItem) {
            console.log('🔄 Producto ya existe en el carrito. Actualizando cantidad...');
            if (existingItem.quantity + 1 > product.stock_quantity) {
              console.warn('🚫 Stock insuficiente para aumentar cantidad');
              toast.error('No hay suficiente stock disponible');
              return;
            }

            const updatedItems = currentCart.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );

            console.log('✅ Nueva lista de items en el carrito:', updatedItems);

            set({
              cart: {
                items: updatedItems,
                total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
                itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
              }
            });

            toast.success('Cantidad actualizada en el carrito');
          } else {
            console.log('🆕 Producto nuevo. Verificando stock...');

            if (product.stock_quantity < 1) {
              console.warn('🚫 Producto sin stock disponible');
              toast.error('Producto sin stock disponible');
              return;
            }

            console.log('✅ Producto disponible. Agregándolo al carrito...');
            const updatedItems = [...currentCart.items, { ...item, quantity: 1 }];

            console.log('🛒 Nueva lista de items en el carrito:', updatedItems);

            set({
              cart: {
                items: updatedItems,
                total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
                itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
              }
            });

            toast.success('Producto agregado al carrito');
          }
        } catch (error) {
          console.error('❌ Error al agregar al carrito:', error);
          toast.error('Error al agregar el producto');
        }
      },

      removeItem: (itemId) => {
        console.log('🗑 Eliminando producto del carrito:', itemId);

        const currentCart = get().cart;
        const updatedItems = currentCart.items.filter(i => i.id !== itemId);

        console.log('🛒 Nueva lista de items en el carrito tras eliminación:', updatedItems);

        set({
          cart: {
            items: updatedItems,
            total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
          }
        });

        toast.success('Producto eliminado del carrito');
      },

      updateQuantity: async (itemId, quantity) => {
        console.log('🔄 Actualizando cantidad del producto:', itemId, 'Nueva cantidad:', quantity);

        if (quantity < 1) {
          console.warn('⚠️ Cantidad menor a 1. Eliminando producto...');
          get().removeItem(itemId);
          return;
        }

        try {
          const supabase = getSupabaseClient();
          console.log('✅ Supabase client obtenido:', supabase);
          await new Promise(resolve => setTimeout(resolve, 0));

          console.log('🔍 Consultando stock en Supabase para producto:', itemId);
          const { data: product, error } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', itemId)
            .single();

          console.log('📡 Respuesta de Supabase:', product, error);

          if (error) {
            console.error('❌ Error verificando stock:', error);
            toast.error('Error al verificar disponibilidad');
            return;
          }

          if (!product) {
            console.warn('⚠️ Producto no encontrado en la base de datos:', itemId);
            toast.error('Producto no encontrado');
            return;
          }

          if (quantity > product.stock_quantity) {
            console.warn('🚫 Stock insuficiente para actualizar cantidad');
            toast.error('No hay suficiente stock disponible');
            return;
          }

          const currentCart = get().cart;
          console.log('🛒 Estado actual del carrito:', currentCart);

          const updatedItems = currentCart.items.map(i =>
            i.id === itemId ? { ...i, quantity } : i
          );

          console.log('✅ Nueva lista de items en el carrito:', updatedItems);

          set({
            cart: {
              items: updatedItems,
              total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
              itemCount: updatedItems.reduce((sum, i) => sum + i.quantity, 0)
            }
          });

          toast.success('Cantidad actualizada');
        } catch (error) {
          console.error('❌ Error al actualizar cantidad:', error);
          toast.error('Error al actualizar la cantidad');
        }
      },

      clearCart: () => {
        console.log('🗑 Vaciando carrito...');
        set({ cart: initialState });
        toast.success('Carrito vaciado');
      }
    }),
    {
      name: 'cart-storage',
      version: 2,
      migrate: (persistedState: any, version) => {
        if (version === 1) {
          console.warn('⚠️ Migrando carrito desde versión 1 a 2...');
          return { cart: initialState };
        }
        return persistedState;
      }
    }
  )
);

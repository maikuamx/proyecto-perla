import { useQuery } from '@tanstack/react-query'
import { getSupabaseClient } from '../lib/supabase'
import type { Product, ProductFilters } from '../types/product'

export function useProducts(filters?: ProductFilters) {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        const supabase = getSupabaseClient()
        let query = supabase
          .from('products')
          .select('*')
          .gt('stock_quantity', 0) // Only fetch products with stock > 0

        if (filters?.category) {
          query = query.eq('category', filters.category)
        }

        if (filters?.sort) {
          switch (filters.sort) {
            case 'price-asc':
              query = query.order('price', { ascending: true })
              break
            case 'price-desc':
              query = query.order('price', { ascending: false })
              break
            case 'newest':
              query = query.order('created_at', { ascending: false })
              break
            default:
              query = query.order('created_at', { ascending: false })
          }
        } else {
          query = query.order('created_at', { ascending: false })
        }

        const { data, error } = await query

        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }

        if (!data) {
          return []
        }

        return data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          size: product.size,
          stock_quantity: product.stock_quantity,
          images: Array.isArray(product.images) ? product.images : [],
          created_at: product.created_at,
          updated_at: product.updated_at
        }))
      } catch (error) {
        console.error('Error in useProducts:', error)
        throw error
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true
  })
}
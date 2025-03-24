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
          console.error('Error fetching products:', error)
          throw error
        }

        if (!data) {
          return []
        }

        // Ensure all required fields are present
        return data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category as ProductCategory,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: false
  })
}
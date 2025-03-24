export type Product = {
    id: string
    name: string
    description: string
    price: number
    category: string
    size?: string | null
    stock_quantity: number
    images: string[]
    created_at: string
    updated_at: string | null
  }
  
  export type ProductCategory = 'clothing' | 'shoes' | 'accessories'
  
  export interface ProductFormData {
    name: string
    description: string
    price: number
    category: ProductCategory
    size?: string | null
    stock_quantity: number
    images: string[]
  }
  
  export interface ProductFilters {
    category?: ProductCategory
    sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest'
  }
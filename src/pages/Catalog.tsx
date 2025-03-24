import { useState, useEffect } from 'react'
import { FiFilter } from 'react-icons/fi'
import ProductGrid from '../components/ProductGrid'
import type { ProductFilters, ProductCategory } from '../types/product'

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'clothing', label: 'Ropa' },
  { value: 'shoes', label: 'Zapatos' },
  { value: 'accessories', label: 'Accesorios' }
]

const sortOptions = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
  { value: 'newest', label: 'Más Recientes' }
]

export default function Catalog() {
  const [filters, setFilters] = useState<ProductFilters>({})
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  useEffect(() => {
    document.title = 'Catálogo - Sapphirus'
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuestro Catálogo</h1>
            <p className="mt-1 text-sm text-gray-500">
              Encuentra los mejores productos americanos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
            >
              <FiFilter className="h-4 w-4" />
              Filtros
            </button>

            <div className="flex gap-4 w-full sm:w-auto">
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  category: e.target.value as ProductCategory || undefined
                }))}
                className="block w-full sm:w-40 rounded-full border-gray-300 text-sm focus:border-primary focus:ring-primary"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.sort || 'featured'}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  sort: e.target.value as ProductFilters['sort']
                }))}
                className="block w-full sm:w-48 rounded-full border-gray-300 text-sm focus:border-primary focus:ring-primary"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <ProductGrid filters={filters} />
      </div>
    </div>
  )
}
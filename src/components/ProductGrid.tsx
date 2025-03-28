import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import ProductCard from './ProductCard'
import ProductQuickView from './ProductQuickView'
import ImageZoom from './ImageZoom'
import type { Product, ProductFilters } from '../types/product'
import { useCartStore } from '../stores/cartStore'

interface ProductGridProps {
  filters?: ProductFilters
  limit?: number
  featured?: boolean
}

export default function ProductGrid({ filters, limit, featured }: ProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [zoomImage, setZoomImage] = useState<{ src: string; alt: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = featured ? (limit || 6) : 15
  const { addItem } = useCartStore()

  const { data: products = [], isLoading, error } = useProducts(filters)

  const handleAddToCart = async (product: Product) => {
    await addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: product.size
    })
  }

  const handleImageClick = (src: string, alt: string) => {
    setZoomImage({ src, alt })
  }

  let displayProducts = [...products]

  if (featured) {
    // Show latest products instead of random ones
    displayProducts = displayProducts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit || 6)
  } else {
    displayProducts = displayProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(featured ? (limit || 6) : itemsPerPage)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg" />
            <div className="mt-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los productos</p>
      </div>
    )
  }

  if (!displayProducts?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay productos disponibles</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onQuickView={setQuickViewProduct}
            onImageClick={() => handleImageClick(product.images[0], product.name)}
          />
        ))}
      </div>

      {!featured && products.length > itemsPerPage && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            {[...Array(Math.ceil(products.length / itemsPerPage))].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-full ${
                  currentPage === i + 1
                    ? 'bg-blue-gray text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(products.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <ProductQuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {zoomImage && (
        <ImageZoom
          src={zoomImage.src}
          alt={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
    </>
  )
}
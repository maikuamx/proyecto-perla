import { Link } from 'react-router-dom'
import { FiShoppingCart, FiEye } from 'react-icons/fi'
import type { Product } from '../types/product'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onQuickView: (product: Product) => void
  onImageClick: () => void
}

export default function ProductCard({ product, onAddToCart, onQuickView, onImageClick }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-transform hover:-translate-y-1">
      <div 
        className="relative aspect-square cursor-zoom-in"
        onClick={onImageClick}
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {product.category}
        </div>
        
        <Link to={`/product/${product.id}`}>
          <h3 className="text-gray-900 font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-semibold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.size && (
            <span className="text-sm text-gray-500">
              Talla: {product.size}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock_quantity === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart className="h-4 w-4" />
            {product.stock_quantity === 0 ? 'Agotado' : 'Añadir'}
          </button>
          
          <button
            onClick={() => onQuickView(product)}
            className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiEye className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
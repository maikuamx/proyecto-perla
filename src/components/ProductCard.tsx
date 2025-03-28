import { Link } from 'react-router-dom'
import { FiShoppingCart, FiEye, FiEdit2 } from 'react-icons/fi'
import type { Product } from '../types/product'
import { useAuth } from '../hooks/useAuth'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onQuickView: (product: Product) => void
  onImageClick: () => void
}

export default function ProductCard({ product, onAddToCart, onQuickView, onImageClick }: ProductCardProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await onAddToCart(product)
  }

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
        {!isAdmin && product.stock_quantity > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute top-4 right-4 p-2 bg-blue-gray text-white rounded-full hover:bg-blue-gray/90 transition-colors"
          >
            <FiShoppingCart className="h-5 w-5" />
          </button>
        )}
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
          <div className="flex items-center gap-2">
            {product.size && (
              <span className="text-sm text-gray-500">
                Talla: {product.size}
              </span>
            )}
            <span className={`text-sm ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock_quantity > 0 ? `Stock: ${product.stock_quantity}` : 'Sin stock'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isAdmin ? (
            <Link
              to="/admin"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
            >
              <FiEdit2 className="h-4 w-4" />
              Editar Producto
            </Link>
          ) : (
            <button
              onClick={() => onQuickView(product)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
            >
              <FiEye className="h-4 w-4" />
              Ver detalles
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
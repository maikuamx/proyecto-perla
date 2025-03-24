import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiTrash2, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi'
import { useCartStore } from '../stores/cartStore'

export default function Cart() {
  const { cart, updateQuantity, removeItem } = useCartStore()

  useEffect(() => {
    document.title = 'Carrito - Sapphirus'
  }, [])

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Tu carrito está vacío</h1>
            <p className="mt-2 text-gray-500">
              Parece que aún no has añadido productos a tu carrito
            </p>
            <Link
              to="/catalogo"
              className="mt-8 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors"
            >
              <FiArrowLeft className="h-5 w-5" />
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Carrito de Compras
            </h1>

            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 flex items-center gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />

                  <div className="flex-1">
                    <h3 className="text-gray-900 font-medium">{item.name}</h3>
                    {item.size && (
                      <p className="text-sm text-gray-500">Talla: {item.size}</p>
                    )}
                    <p className="text-primary font-medium">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <FiMinus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <FiPlus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <Link
              to="/catalogo"
              className="mt-8 inline-flex items-center gap-2 text-primary hover:text-secondary"
            >
              <FiArrowLeft className="h-5 w-5" />
              Continuar comprando
            </Link>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">${cart.total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="text-gray-900">
                    {cart.total > 50 ? 'Gratis' : '$4.99'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Impuestos</span>
                  <span className="text-gray-900">
                    ${(cart.total * 0.16).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      ${(cart.total + (cart.total > 50 ? 0 : 4.99) + cart.total * 0.16).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {/* TODO: Implement checkout */}}
                  className="w-full bg-primary text-white px-6 py-3 rounded-full hover:bg-secondary transition-colors"
                >
                  Proceder al pago
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
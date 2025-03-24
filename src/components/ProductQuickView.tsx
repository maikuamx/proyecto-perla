import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { FiX, FiShoppingCart } from 'react-icons/fi'
import type { Product } from '../types/product'

interface ProductQuickViewProps {
  product: Product | null
  onClose: () => void
  onAddToCart: (product: Product) => void
}

export default function ProductQuickView({ product, onClose, onAddToCart }: ProductQuickViewProps) {
  if (!product) return null

  return (
    <Transition appear show={!!product} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      {product.name}
                    </Dialog.Title>

                    <div className="mt-2">
                      <p className="text-gray-500 text-sm">{product.description}</p>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.size && (
                          <span className="text-sm text-gray-500">
                            Talla: {product.size}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <span className="text-sm text-gray-500">
                          Disponibilidad: {' '}
                          <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {product.stock_quantity > 0 ? 'En stock' : 'Agotado'}
                          </span>
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onAddToCart(product)
                          onClose()
                        }}
                        disabled={product.stock_quantity === 0}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-gray text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-gray/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiShoppingCart className="h-5 w-5" />
                        {product.stock_quantity === 0 ? 'Agotado' : 'Añadir al carrito'}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
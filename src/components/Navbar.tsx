import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMenu, FiSearch, FiUser, FiShoppingBag } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import UserMenu from './UserMenu'
import { useCartStore } from '../stores/cartStore'
import CartCount from './CartCount'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isLoading } = useAuth()
  const { cart } = useCartStore()

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            >
              <FiMenu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/assets/logo-black.png"
                alt="Sapphirus"
              />
            </Link>
            <div className="hidden md:flex md:ml-6 space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Inicio
              </Link>
              <Link
                to="/catalogo"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Catálogo
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
              <FiSearch className="h-5 w-5 text-gray-500" />
              <input
                type="search"
                placeholder="Buscar productos..."
                className="ml-2 bg-transparent border-none focus:outline-none text-sm"
              />
            </div>
            <div className="flex items-center ml-4 space-x-4">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
              ) : user ? (
                <UserMenu user={user} />
              ) : (
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <FiUser className="h-6 w-6" />
                </Link>
              )}
              {!user?.role || user.role !== 'admin' ? (
                <Link
                  to="/cart"
                  className="text-gray-600 hover:text-gray-900 relative"
                >
                  <FiShoppingBag className="h-6 w-6" />
                  {cart.itemCount > 0 && <CartCount />}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Inicio
          </Link>
          <Link
            to="/catalogo"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Catálogo
          </Link>
        </div>
      </div>
    </nav>
  )
}
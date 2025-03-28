import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiShoppingBag, FiMapPin, FiLogOut, FiSettings } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { useCartStore } from '../stores/cartStore'
import type { User } from '../types/user'

interface UserMenuProps {
  user: User
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const clearCart = useCartStore(state => state.clearCart)
  const isAdmin = user.role === 'admin'

  useOnClickOutside<HTMLDivElement>(menuRef, () => setIsOpen(false))

  const handleSignOut = async () => {
    try {
      await signOut()
      clearCart()
      setIsOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <FiUser className="h-6 w-6" />
        <span className="hidden md:block text-sm font-medium">
          {user.first_name || 'Usuario'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <FiSettings className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <FiUser className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>

              <Link
                to="/orders"
                className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <FiShoppingBag className="mr-2 h-4 w-4" />
                Mis Pedidos
              </Link>

              <Link
                to="/addresses"
                className=" px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <FiMapPin className="mr-2 h-4 w-4" />
                Mis Direcciones
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            className=" w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <FiLogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  )
}
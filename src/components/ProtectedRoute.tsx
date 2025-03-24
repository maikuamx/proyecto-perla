import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: 'user' | 'admin'
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-gray border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    localStorage.setItem('redirectAfterLogin', window.location.pathname)
    toast.error('Debes iniciar sesión para acceder a esta página')
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    toast.error('No tienes permisos para acceder a esta página')
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
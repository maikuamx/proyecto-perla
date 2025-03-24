import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, signUp, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    acceptTerms: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      await signIn({
        email: formData.email,
        password: formData.password
      })
    } else {
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image Section */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-blue-gray">
              <img
                src="/auth-bg.jpg"
                alt="Background"
                className="w-full h-full object-cover mix-blend-overlay"
              />
            </div>
            <div className="relative h-full flex items-center justify-center p-12 text-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Sapphirus</h2>
                <p className="text-white/90">
                  Tu tienda de productos americanos en Chihuahua
                </p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 lg:p-12">
            <div className="mb-8 flex justify-between items-center">
              <Link
                to="/"
                className="text-gray-medium hover:text-dark flex items-center gap-2 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
                Volver al sitio
              </Link>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-dark mb-2">
                {isLogin ? 'Iniciar Sesión' : 'Crear cuenta'}
              </h1>
              <p className="text-gray-medium mb-8">
                {isLogin ? (
                  <>
                    ¿No tienes una cuenta?{' '}
                    <button
                      onClick={() => setIsLogin(false)}
                      className="text-blue-gray hover:text-dark font-medium transition-colors"
                    >
                      Regístrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      onClick={() => setIsLogin(true)}
                      className="text-blue-gray hover:text-dark font-medium transition-colors"
                    >
                      Inicia sesión
                    </button>
                  </>
                )}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-medium mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-gray focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-medium mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-gray focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-medium mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-gray focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-medium mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-gray focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-medium hover:text-dark transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5" />
                      ) : (
                        <FiEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {isLogin ? (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-gray focus:ring-blue-gray"
                      />
                      <span className="text-sm text-gray-medium">Recordarme</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-blue-gray hover:text-dark transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                      required
                      className="w-4 h-4 rounded border-gray-300 text-blue-gray focus:ring-blue-gray"
                    />
                    <span className="text-sm text-gray-medium">
                      Acepto los{' '}
                      <Link to="/terms" className="text-blue-gray hover:text-dark">
                        Términos y Condiciones
                      </Link>
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-gray text-white px-6 py-3 rounded-lg font-medium hover:bg-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Iniciar Sesión' : 'Crear cuenta'}
                      <FiArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
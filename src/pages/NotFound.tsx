import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Página no encontrada</p>
        <Link 
          to="/" 
          className="mt-8 inline-block px-6 py-3 bg-primary text-white rounded-full hover:bg-secondary transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
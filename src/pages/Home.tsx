import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import { FaShippingFast, FaCheckCircle, FaHeadset } from 'react-icons/fa'
import ProductGrid from '../components/ProductGrid'
import ContactForm from '../components/ContactForm'
import FAQAccordion from '../components/FAQAccordion'

export default function Home() {
  useEffect(() => {
    document.title = 'Sapphirus - Tienda de artículos Americanos'
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/hero-bg.jfif"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-blue-gray/80" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl text-center mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Bienvenido a Sapphirus
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Tu tienda de productos americanos en Chihuahua
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/catalogo"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-gray px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-light transition-all transform hover:-translate-y-1 hover:shadow-lg"
              >
                Ver Catálogo
                <FiArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all transform hover:-translate-y-1"
              >
                Conoce más
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white" id="about">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Sobre Nosotros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-beige text-blue-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShippingFast className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Envío Rápido</h3>
              <p className="text-gray-medium">
                Entrega directa con productos desde Estados Unidos
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-beige text-blue-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Productos Originales</h3>
              <p className="text-gray-medium">
                100% auténticos y garantizados
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-beige text-blue-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeadset className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Atención 24/7</h3>
              <p className="text-gray-medium">
                Soporte personalizado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Productos Destacados
          </h2>
          <ProductGrid featured limit={6} filters={{ sort: 'featured' }} />
          <div className="text-center mt-12">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 bg-blue-gray text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-dark transition-colors"
            >
              Ver Catálogo Completo
              <FiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-light p-6 rounded-lg">
              <div className="flex text-blue-gray mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star" />
                ))}
              </div>
              <p className="text-gray-medium mb-6">
                "Excelente servicio y productos de alta calidad. Definitivamente volveré a comprar."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="Cliente"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium">María González</h4>
                  <span className="text-sm text-gray-medium">Cliente Verificado</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-light p-6 rounded-lg">
              <div className="flex text-blue-gray mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star${i === 4 ? '-half-alt' : ''}`} />
                ))}
              </div>
              <p className="text-gray-medium mb-6">
                "Los productos llegaron en perfecto estado y antes de lo esperado. Muy recomendable."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Cliente"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium">Carlos Ramírez</h4>
                  <span className="text-sm text-gray-medium">Cliente Verificado</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-light p-6 rounded-lg">
              <div className="flex text-blue-gray mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fas fa-star" />
                ))}
              </div>
              <p className="text-gray-medium mb-6">
                "La atención al cliente es excepcional. Resolvieron todas mis dudas rápidamente."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  alt="Cliente"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="font-medium">Laura Mendoza</h4>
                  <span className="text-sm text-gray-medium">Cliente Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-light" id="contact">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Empecemos algo juntos
            </h2>
            <p className="text-center text-gray-medium mb-12">
              ¿Tienes alguna pregunta sobre nuestros productos o necesitas ayuda con tu pedido? Estamos aquí para ayudarte.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-white" id="FAQs">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto">
            <FAQAccordion />
          </div>
        </div>
      </section>
    </div>
  )
}
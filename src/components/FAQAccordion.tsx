import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: '¿Qué tipo de ropa venden en Sapphirus?',
    answer: 'En Sapphirus ofrecemos ropa americana original, incluyendo sudaderas, camisetas, pantalones, chamarras y accesorios de marcas reconocidas.'
  },
  {
    question: '¿Las prendas son originales y de importación?',
    answer: 'Sí, toda nuestra ropa es 100% original y traída directamente desde Estados Unidos, garantizando calidad y autenticidad.'
  },
  {
    question: '¿Cómo puedo comprar en Sapphirus?',
    answer: 'Puedes hacer tu compra a través de nuestra tienda en línea, redes sociales o visitándonos en nuestra tienda física. Contamos con varias opciones de pago.'
  },
  {
    question: '¿Realizan envíos a todo el país?',
    answer: 'Sí, enviamos a nivel nacional. Los costos y tiempos de entrega pueden variar según la ubicación. Contáctanos para más detalles.'
  },
  {
    question: '¿Cómo sé qué talla elegir?',
    answer: 'Contamos con una guía de tallas para ayudarte a seleccionar la medida correcta. Si tienes dudas, puedes consultarnos y con gusto te asesoramos.'
  },
  {
    question: '¿Tienen ofertas o descuentos?',
    answer: 'Sí, frecuentemente tenemos promociones especiales. Te recomendamos seguirnos en nuestras redes sociales para enterarte de las últimas ofertas.'
  }
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none"
          >
            <span className="text-lg font-medium text-gray-900">
              {faq.question}
            </span>
            <FiChevronDown
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          
          <div
            className={`transition-all duration-200 ease-in-out ${
              openIndex === index
                ? 'max-h-48 opacity-100'
                : 'max-h-0 opacity-0'
            }`}
          >
            <p className="px-6 pb-4 text-gray-600">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
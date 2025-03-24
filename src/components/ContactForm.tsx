import { useState } from 'react'
import { FiSend, FiUser, FiMail, FiMessageSquare } from 'react-icons/fi'

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState({
    name: '',
    interest: '',
    email: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset form
    setFormState({
      name: '',
      interest: '',
      email: '',
      message: ''
    })
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiUser className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id="name"
          value={formState.name}
          onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
          required
          placeholder="Mi nombre es"
          className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiMessageSquare className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          id="interest"
          value={formState.interest}
          onChange={(e) => setFormState(prev => ({ ...prev, interest: e.target.value }))}
          required
          placeholder="Me interesa"
          className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiMail className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="email"
          id="email"
          value={formState.email}
          onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
          required
          placeholder="Me puedes contactar en"
          className="block w-full pl-10 pr-3 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
        />
      </div>

      <div>
        <textarea
          id="message"
          value={formState.message}
          onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
          required
          placeholder="Tu mensaje"
          rows={4}
          className="block w-full px-3 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white/50 backdrop-blur-sm transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-gray text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-gray/90 transition-all transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Enviando...
          </>
        ) : (
          <>
            <FiSend className="h-5 w-5" />
            Enviar mensaje
          </>
        )}
      </button>
    </form>
  )
}
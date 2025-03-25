import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { FiArrowLeft } from 'react-icons/fi'

interface CheckoutFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`
      }
    })

    if (error) {
      setMessage(error.message || 'Error al procesar el pago')
    } else {
      onSuccess()
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {message && (
        <div className="text-red-500 text-sm">{message}</div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft className="h-5 w-5" />
          Volver
        </button>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="bg-blue-gray text-white px-6 py-2 rounded-full hover:bg-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Procesando...' : 'Pagar ahora'}
        </button>
      </div>
    </form>
  )
}
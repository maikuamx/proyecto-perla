import { useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { usePayment } from '../hooks/usePayment'
import { getStripe } from '../lib/stripe'
import CheckoutForm from './CheckoutForm'

interface PaymentFormProps {
    amount: number
    onSuccess: () => void
    onCancel: () => void
  }
  
  export default function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
    const { createPayment, isLoading, error } = usePayment()
  
    useEffect(() => {
      createPayment({ amount: Math.round(amount * 100) })
    }, [amount, createPayment])
  
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-gray border-t-transparent" />
        </div>
      )
    }
  
    if (error) {
      return (
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">Error al procesar el pago</p>
          <button
            onClick={onCancel}
            className="text-blue-gray hover:text-dark transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }
  
    return (
      <Elements stripe={getStripe()}>
        <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    )
  }
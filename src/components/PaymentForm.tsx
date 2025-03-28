import { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { usePayment } from '../hooks/usePayment'
import { getStripe } from '../lib/stripe'
import CheckoutForm from './CheckoutForm'
import { Stripe } from '@stripe/stripe-js'
import type { CartItem } from '../types/cart'


interface PaymentFormProps {
  amount: number
  onSuccess: () => void
  onCancel: () => void
  items: CartItem[]
  total: number
}

export default function PaymentForm({ amount, onSuccess, onCancel, items, total }: PaymentFormProps) {
  const { createPayment, isLoading, error } = usePayment()
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    getStripe().then(setStripe)
  }, [])

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await createPayment({ 
          amount: Math.round(amount * 100),
          currency: 'mxn'
        })
        setClientSecret(response.clientSecret)
      } catch (err) {
        console.error('Error creating payment:', err)
      }
    }

    if (amount > 0) {
      fetchPayment()
    }
  }, [amount, createPayment])

  if (isLoading || !stripe || !clientSecret) {
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
    <Elements stripe={stripe} options={{ 
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#708090',
        }
      }
    }}>
      <CheckoutForm 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
        items={items}
        total={total}
      />
    </Elements>
  )
}
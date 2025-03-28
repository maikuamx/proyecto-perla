import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { CartItem } from '../types/cart'

interface CheckoutFormProps {
  onSuccess: () => void
  onCancel: () => void
  items: CartItem[]
  total: number
}

export default function CheckoutForm({ onSuccess, onCancel, items, total }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const { user } = useAuth()

  const createOrder = async (paymentIntentId: string) => {
    console.log('Creating order for payment:', paymentIntentId)
    const supabase = getSupabaseClient()

    try {
      // Verify all products exist and have sufficient stock
      for (const item of items) {
        console.log('Checking stock for product:', item.id)
        const { data: product, error } = await supabase
          .from('products')
          .select('id, stock_quantity')
          .eq('id', item.id)
          .maybeSingle()

        if (error) {
          console.error('Error checking product:', error)
          throw new Error(`Error al verificar producto: ${error.message}`)
        }

        if (!product) {
          console.error('Product not found:', item.id)
          throw new Error(`Producto no encontrado: ${item.id}`)
        }

        if (product.stock_quantity < item.quantity) {
          console.error('Insufficient stock:', item.id, product.stock_quantity, item.quantity)
          throw new Error(`Stock insuficiente para ${item.name}`)
        }
      }

      console.log('All products verified, creating order...')

      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          total,
          status: 'completed',
          payment_intent_id: paymentIntentId
        }])
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw new Error(`Error al crear el pedido: ${orderError.message}`)
      }

      console.log('Order created:', order.id)

      // Create order items and update stock
      for (const item of items) {
        console.log('Processing item:', item.id)
        
        // Create order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          })

        if (itemError) {
          console.error('Error creating order item:', itemError)
          throw new Error(`Error al crear item del pedido: ${itemError.message}`)
        }

        console.log('Order item created, updating stock...')


        console.log('Disminuyendo stock para:', item.id, 'Cantidad:', item.quantity);


        // Update stock
        const { error: stockError } = await supabase.rpc('decrease_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity
        })

        if (stockError) {
          console.error('Error updating stock:', stockError)
          throw new Error(`Error al actualizar stock: ${stockError.message}`)
        }

        console.log('Stock updated successfully')
      }

      console.log('Order completed successfully')
      return order
    } catch (error) {
      console.error('Error in createOrder:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      console.error('Stripe not initialized')
      return
    }

    try {
      setIsProcessing(true)
      setMessage('')

      console.log('Processing payment...')

      // Process payment
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      })

      console.log('Payment result:', { paymentError, paymentIntent })

      if (paymentError) {
        console.error('Payment error:', paymentError)
        throw new Error(paymentError.message || 'Error al procesar el pago')
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded, creating order...')
        
        // Create order and update stock
        await createOrder(paymentIntent.id)
        
        console.log('Order created successfully')
        toast.success('¡Pago realizado con éxito!')
        onSuccess()
      } else {
        console.error('Payment not succeeded:', paymentIntent?.status)
        throw new Error('El pago no fue completado')
      }
    } catch (error) {
      console.error('Error in payment process:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago'
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
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
          disabled={isProcessing}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
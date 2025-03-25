import { useMutation } from '@tanstack/react-query'
import { createPaymentIntent } from '../lib/api'

interface PaymentResponse {
  clientSecret: string
}

export function usePayment() {
  const createPayment = useMutation<PaymentResponse, Error, { amount: number; currency?: string }>({
    mutationFn: async ({ amount, currency = 'usd' }) => {
      const response = await createPaymentIntent(amount, currency)
      return response
    }
  })

  return {
    createPayment: createPayment.mutateAsync,
    isLoading: createPayment.isPending,
    error: createPayment.error,
    clientSecret: createPayment.data?.clientSecret
  }
}
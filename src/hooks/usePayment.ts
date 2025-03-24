import { useMutation } from '@tanstack/react-query'
import { createPaymentIntent } from '../lib/api'
import { getStripe } from '../lib/stripe'

export function usePayment() {
  const createPayment = useMutation({
    mutationFn: async ({ amount, currency = 'usd' }: { amount: number; currency?: string }) => {
      const { clientSecret } = await createPaymentIntent(amount, currency)
      const stripe = await getStripe()
      
      if (!stripe) {
        throw new Error('Stripe not initialized')
      }

      return stripe.confirmPayment({
        elements: stripe.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#708090',
            },
          },
        }),
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
      })
    }
  })

  return {
    createPayment: createPayment.mutate,
    isLoading: createPayment.isPending,
    error: createPayment.error
  }
}
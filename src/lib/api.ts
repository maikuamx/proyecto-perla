const API_URL = 'https://proyecto-perla.onrender.com/api'

export async function getStripeConfig() {
  const response = await fetch(`${API_URL}/stripe-config`)
  if (!response.ok) {
    throw new Error('Failed to fetch Stripe configuration')
  }
  return response.json()
}

export async function createPaymentIntent(amount: number, currency: string = 'mxn') {
  const response = await fetch(`${API_URL}/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create payment intent')
  }
  
  return response.json()
}

export async function getSupabaseConfig() {
  const response = await fetch(`${API_URL}/supabase-config`)
  if (!response.ok) {
    throw new Error('Failed to fetch Supabase configuration')
  }
  return response.json()
}
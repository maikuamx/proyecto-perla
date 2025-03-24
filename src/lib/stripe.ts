import { loadStripe } from '@stripe/stripe-js'
import { getStripeConfig } from './api'

let stripePromise: Promise<any> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = getStripeConfig().then(config => 
      loadStripe(config.publishableKey)
    )
  }
  return stripePromise
}
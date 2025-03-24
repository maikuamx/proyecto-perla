import { useCartStore } from '../stores/cartStore'

export default function CartCount() {
  const { cart } = useCartStore()

  if (cart.itemCount === 0) return null

  return (
    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
      {cart.itemCount}
    </span>
  )
}
export interface CartItem {
    id: string
    name: string
    price: number
    image: string
    quantity: number
    size?: string | null
  }
  
  export interface Cart {
    items: CartItem[]
    total: number
    itemCount: number
  }
export interface Order {
    id: string
    created_at: string
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
    total: number
    items: Array<{
      quantity: number
      name: string
      price: number
    }>
  }
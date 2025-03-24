export interface Database {
    public: {
      Tables: {
        users: {
          Row: {
            id: string
            email: string
            first_name: string | null
            last_name: string | null
            role: 'user' | 'admin'
            created_at: string
            updated_at: string | null
            email_verified: boolean | null
            verification_token: string | null
            verification_expires_at: string | null
          }
          Insert: {
            id: string
            email: string
            first_name?: string | null
            last_name?: string | null
            role?: 'user' | 'admin'
            created_at?: string
            updated_at?: string | null
            email_verified?: boolean | null
            verification_token?: string | null
            verification_expires_at?: string | null
          }
          Update: {
            id?: string
            email?: string
            first_name?: string | null
            last_name?: string | null
            role?: 'user' | 'admin'
            created_at?: string
            updated_at?: string | null
            email_verified?: boolean | null
            verification_token?: string | null
            verification_expires_at?: string | null
          }
        }
        products: {
          Row: {
            id: string
            name: string
            description: string
            price: number
            category: string
            size: string | null
            stock_quantity: number
            images: string[]
            created_at: string
            updated_at: string | null
          }
          Insert: {
            id?: string
            name: string
            description: string
            price: number
            category: string
            size?: string | null
            stock_quantity: number
            images: string[]
            created_at?: string
            updated_at?: string | null
          }
          Update: {
            id?: string
            name?: string
            description?: string
            price?: number
            category?: string
            size?: string | null
            stock_quantity?: number
            images?: string[]
            created_at?: string
            updated_at?: string | null
          }
        }
        orders: {
          Row: {
            id: string
            user_id: string | null
            total: number
            status: 'pending' | 'processing' | 'completed' | 'cancelled'
            created_at: string
            payment_intent_id: string | null
            shipping_address_id: string | null
          }
          Insert: {
            id?: string
            user_id?: string | null
            total: number
            status?: 'pending' | 'processing' | 'completed' | 'cancelled'
            created_at?: string
            payment_intent_id?: string | null
            shipping_address_id?: string | null
          }
          Update: {
            id?: string
            user_id?: string | null
            total?: number
            status?: 'pending' | 'processing' | 'completed' | 'cancelled'
            created_at?: string
            payment_intent_id?: string | null
            shipping_address_id?: string | null
          }
        }
        order_items: {
          Row: {
            id: string
            order_id: string | null
            product_id: string | null
            quantity: number
            price: number
            created_at: string
          }
          Insert: {
            id?: string
            order_id?: string | null
            product_id?: string | null
            quantity: number
            price: number
            created_at?: string
          }
          Update: {
            id?: string
            order_id?: string | null
            product_id?: string | null
            quantity?: number
            price?: number
            created_at?: string
          }
        }
        addresses: {
          Row: {
            id: string
            user_id: string | null
            name: string
            street: string
            city: string
            state: string
            zip_code: string
            phone: string
            instructions: string | null
            created_at: string
            updated_at: string | null
          }
          Insert: {
            id?: string
            user_id?: string | null
            name: string
            street: string
            city: string
            state: string
            zip_code: string
            phone: string
            instructions?: string | null
            created_at?: string
            updated_at?: string | null
          }
          Update: {
            id?: string
            user_id?: string | null
            name?: string
            street?: string
            city?: string
            state?: string
            zip_code?: string
            phone?: string
            instructions?: string | null
            created_at?: string
            updated_at?: string | null
          }
        }
      }
    }
  }
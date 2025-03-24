export interface User {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: 'user' | 'admin'
    created_at: string
    updated_at: string | null
  }
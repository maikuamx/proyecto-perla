import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export async function initSupabase() {
  if (supabaseInstance) return supabaseInstance

  try {
    // Fetch configuration from server first
    const response = await fetch('https://proyecto-perla.onrender.com/api/supabase-config')
    if (!response.ok) {
      throw new Error('Failed to fetch Supabase configuration')
    }
    
    const config = await response.json()
    const url = config.url
    const anonKey = config.anonKey

    if (!url || !anonKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    supabaseInstance = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      },
      db: {
        schema: 'public'
      }
    })

    // Verify connection with retry logic
    let retries = 3
    while (retries > 0) {
      try {
        const { error } = await supabaseInstance.from('products').select('id').limit(1)
        if (!error) {
          break // Connection successful
        }
        throw error
      } catch (error) {
        retries--
        if (retries === 0) {
          console.error('Error verifying Supabase connection:', error)
          supabaseInstance = null
          throw error
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return supabaseInstance
  } catch (error) {
    console.error('Error initializing Supabase:', error)
    throw error
  }
}

export function getSupabaseClient() {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initSupabase() first')
  }
  return supabaseInstance
}
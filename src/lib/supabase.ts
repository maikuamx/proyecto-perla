import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export async function initSupabase() {
  if (supabaseInstance) return supabaseInstance

  try {
    // First try environment variables
    let url = import.meta.env.VITE_SUPABASE_URL
    let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // If not available in env, fetch from API
    if (!url || !anonKey) {
      const response = await fetch('https://proyecto-perla.onrender.com/api/supabase-config')
      if (!response.ok) {
        throw new Error('Failed to fetch Supabase configuration')
      }
      
      const config = await response.json()
      url = config.url
      anonKey = config.anonKey
    }
    
    if (!url || !anonKey) {
      throw new Error('Missing Supabase configuration')
    }

    supabaseInstance = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })

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
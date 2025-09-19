import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Default client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client with shorter timeout for auth operations
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Shorter fetch timeout for auth operations (15 seconds)
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
    }
  }
})

export type Session = {
  user: UserProfile | null
  isLoggedIn: boolean
}

export type UserProfile = {
  id: string
  email: string | null
  name: string | null
  user_metadata?: Record<string, any>
}

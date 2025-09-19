import { createClient } from "@supabase/supabase-js"
import type { Database, UserProfile } from "./database-types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Default client with standard timeout
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client with shorter timeout for auth operations
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Shorter fetch timeout for auth operations (3 seconds)
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
    }
  }
})

export type Session = {
  user: UserProfile | null
  isLoggedIn: boolean
}

export const getCurrentUser = async (): Promise<Session> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }
    
    if (!session) {
      return { user: null, isLoggedIn: false }
    }
    
    const { data: userMetadata } = await supabase.auth.getUser()
    
    return { 
      user: {
        id: session.user.id,
        email: session.user.email || null,
        name: userMetadata?.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        user_metadata: userMetadata?.user?.user_metadata || {}
      },
      isLoggedIn: true
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, isLoggedIn: false }
  }
}

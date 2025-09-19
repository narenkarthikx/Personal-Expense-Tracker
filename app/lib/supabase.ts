import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Get environment variables with fallbacks for testing environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if required environment variables are available
const hasValidConfig = supabaseUrl && supabaseAnonKey

// Default client
export const supabase = hasValidConfig 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createMockClient() // Use mock client if credentials are missing

// Client with shorter timeout for auth operations
export const supabaseAuth = hasValidConfig
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
  : createMockClient() // Use mock client if credentials are missing

// Create a mock client for testing or when credentials are missing
function createMockClient() {
  // This is a minimal mock implementation that prevents errors
  // when environment variables are missing
  console.warn('Using mock Supabase client - no credentials available')
  
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      exchangeCodeForSession: () => Promise.resolve({ data: null, error: null }),
    },
  } as any;
}

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

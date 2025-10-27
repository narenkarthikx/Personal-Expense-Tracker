import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { protectedRoutes } from './app/lib/routes'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define auth routes - routes for authentication
  const authRoutes = ['/login', '/signup']

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))

  // Get the cookie string
  const cookieString = request.headers.get('cookie') || ''
  
  // Only execute auth checks on protected routes or auth routes
  if (isProtectedRoute || isAuthRoute) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // Skip auth check if environment variables are missing
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Missing Supabase credentials in middleware - skipping auth check')
        
        // For protected routes, redirect to login
        if (isProtectedRoute) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
        
        // For auth routes or other routes, continue
        return NextResponse.next()
      }
      
      // Initialize Supabase client
      const supabase = createClient(
        supabaseUrl,
        supabaseAnonKey,
        { 
          auth: { 
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'app-auth',
            detectSessionInUrl: true,
            storage: {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          },
          global: {
            headers: {
              cookie: cookieString
            }
          }
        }
      )
      
      // Get the session
      const { data: { session } } = await supabase.auth.getSession()
      const isLoggedIn = !!session
      
      // If the user is logged in and tries to access an auth route, redirect to home
      if (isLoggedIn && isAuthRoute) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      // If the user is not logged in and tries to access a protected route, redirect to login
      if (!isLoggedIn && isProtectedRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', path)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      
      // If there's an error and it's a protected route, redirect to login for safety
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }
  
  // Continue the request for non-protected routes or if the user is authenticated
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/account/:path*',
    '/login',
    '/signup',
  ],
}

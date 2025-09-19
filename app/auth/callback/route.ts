import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Route handlers must use dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Get the URL and extract the code
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  // Redirect back to the main app
  return NextResponse.redirect(new URL('/', request.url))
}

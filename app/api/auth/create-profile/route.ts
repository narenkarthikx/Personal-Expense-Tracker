import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/app/lib/database.types'

// Initialize Supabase client with Service Role for admin operations
// This is only used in secure server contexts
const initAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // If either of these values is missing, we can't proceed
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: Request) {
  try {
    const { id, name, email } = await request.json()

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize the admin client
    const supabase = initAdminClient()

    // If we couldn't initialize the client due to missing env vars
    if (!supabase) {
      console.error('Could not initialize Supabase admin client')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error } = await supabase.from('user_profiles').upsert({
      id,
      name: name || email.split('@')[0],
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    if (error) {
      console.error('Error creating user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

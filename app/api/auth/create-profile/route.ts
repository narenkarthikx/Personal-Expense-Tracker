import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/app/lib/database.types'

// Route handlers must use dynamic rendering
export const dynamic = 'force-dynamic'

// Initialize Supabase client with Service Role for admin operations
// This is only used in secure server contexts
const initAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If URL is missing, we can't proceed
  if (!supabaseUrl) {
    console.error('Missing Supabase URL')
    return null
  }

  // If service key is missing, fall back to anon key with reduced functionality
  const key = supabaseServiceKey || supabaseAnonKey
  if (!key) {
    console.error('Missing Supabase keys')
    return null
  }

  return createClient<Database>(supabaseUrl, key, {
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
      // Instead of returning an error, we'll return a success but log the issue
      // This way the signup flow can continue even if we can't create the profile
      return NextResponse.json(
        { success: false, message: 'Server configuration incomplete - profile creation skipped' },
        { status: 200 }
      )
    }

    // Create user profile - first check if it already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingProfile) {
      // Create the profile if it doesn't exist
      const { error } = await supabase.from('user_profiles').upsert({
        id,
        name: name || email.split('@')[0],
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error creating user profile:', error)
        // Still return success to client so signup flow can continue
        return NextResponse.json(
          { success: false, message: 'Error creating profile, but continuing signup' },
          { status: 200 }
        )
      }
    }

    // Create default categories for the user
    const defaultCategories = [
      { name: 'Food', icon: '🍔', user_id: id },
      { name: 'Transport', icon: '🚗', user_id: id },
      { name: 'Shopping', icon: '🛍️', user_id: id },
      { name: 'Entertainment', icon: '🎭', user_id: id },
      { name: 'Bills', icon: '📄', user_id: id },
      { name: 'Health', icon: '⚕️', user_id: id },
      { name: 'Education', icon: '📚', user_id: id },
      { name: 'Other', icon: '📦', user_id: id }
    ]
    
    // First check if the user already has categories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', id)
      .limit(1)
    
    // Only create default categories if the user doesn't have any
    if (!existingCategories || existingCategories.length === 0) {
      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories)
      
      if (categoriesError) {
        console.error('Error creating default categories:', categoriesError)
        // Continue anyway - we don't want to block signup due to categories
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error creating profile:', error)
    // Still return success to client so signup flow can continue
    return NextResponse.json(
      { success: false, message: 'Server error, but continuing signup' },
      { status: 200 }
    )
  }
}

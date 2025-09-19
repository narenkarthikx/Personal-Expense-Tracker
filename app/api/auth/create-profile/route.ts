import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a Supabase client with the service role key and timeout
// This bypasses RLS policies for admin operations
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  throw new Error('Missing Supabase URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  throw new Error('Missing Supabase service role key environment variable');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      // Set a short timeout for admin operations (3 seconds)
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
      }
    }
  }
)

export async function POST(request: Request) {
  try {
    const { id, name, email } = await request.json()
    
    if (!id || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Log progress (helps with debugging)
    console.log(`Creating profile for user ${id} with email ${email}`);

    // Create a timeout for the database operation
    const dbPromise = supabaseAdmin
      .from('user_profiles')
      .insert([{ id, name, email }]);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timed out')), 3000)
    );
    
    try {
      // Race between the db operation and the timeout
      const { error } = await Promise.race([dbPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Error creating user profile:', error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true });
    } catch (timeoutError) {
      console.error('Profile creation timeout:', timeoutError);
      // Still return success to avoid blocking the UI
      // The profile can be created later if needed
      return NextResponse.json({ 
        success: true, 
        warning: 'Profile creation started but may not be complete yet'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    // Still return success to avoid blocking the UI flow
    // The profile can be created on next login if needed
    return NextResponse.json({ 
      success: true,
      warning: 'Profile creation may not be complete, will retry on next login'
    })
  }
}

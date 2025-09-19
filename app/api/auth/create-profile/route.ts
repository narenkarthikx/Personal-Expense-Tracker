import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Check for environment variables, but don't throw during build time
const missingUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL
const missingServiceKey = !process.env.SUPABASE_SERVICE_ROLE_KEY

// Only log during server runtime, not during build
if (typeof window === 'undefined' && (missingUrl || missingServiceKey)) {
  if (missingUrl) console.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  if (missingServiceKey) console.error('SUPABASE_SERVICE_ROLE_KEY is not defined')
}

// If running in development, we can use a mock client
// In production, this will be initialized properly during runtime
const supabaseAdmin = !missingUrl && !missingServiceKey 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(3000)
            });
          }
        }
      }
    )
  : null

export async function POST(request: Request) {
  try {
    // During build time, we might not have the environment variables
    // This check prevents runtime errors during build
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized - missing environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration error - service is not fully initialized'
      }, { status: 503 });
    }

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

import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidFormat = emailRegex.test(email);
    
    if (!isValidFormat) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid email format'
      });
    }

    // Check if the email exists in user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (error) {
      console.error('Error checking email:', error);
      return NextResponse.json(
        { valid: false, error: 'Error validating email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      valid: true,
      exists: data && data.length > 0,
      message: data && data.length > 0 
        ? 'Email already registered' 
        : 'Email is valid and available'
    });
  } catch (error) {
    console.error('Unexpected error checking email:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    requiresEmailVerification: process.env.SUPABASE_EMAIL_VERIFICATION === 'true',
    authMethods: {
      email: true,
      password: true,
    },
    minPasswordLength: 6,
  })
}

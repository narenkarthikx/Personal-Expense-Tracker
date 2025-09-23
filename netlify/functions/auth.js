// This function handles Supabase authentication in Netlify Functions environment
// which is more compatible than Edge runtime
export async function handler(event) {
  const { path } = event;
  
  // Handle auth callback
  if (path.includes('/auth/callback')) {
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard',
      },
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Auth function ready" }),
  };
}

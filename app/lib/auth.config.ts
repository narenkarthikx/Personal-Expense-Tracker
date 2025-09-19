export const authConfig = {
  pages: {
    signIn: '/login',
    signUp: '/signup',
    forgotPassword: '/forgot-password',
    newUser: '/',
    verifyRequest: '/verify-request',
  },
  callbacks: {
    authorized({ auth, request }: { 
      auth: { user?: unknown } | null; 
      request: { nextUrl: { pathname: string } } 
    }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedPage = request.nextUrl.pathname.startsWith('/account')
      
      if (isOnProtectedPage) {
        if (isLoggedIn) return true
        return false
      } else if (request.nextUrl.pathname.startsWith('/login') || 
                request.nextUrl.pathname.startsWith('/signup')) {
        if (isLoggedIn) return false
        return true
      }
      
      return true
    },
  },
}

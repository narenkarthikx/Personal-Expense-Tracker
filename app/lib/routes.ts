// Specify all routes that should not be statically generated
export const dynamicRoutes = [
  '/account',
  '/login',
  '/signup'
];

// Specify all routes that should be protected by authentication
export const protectedRoutes = [
  '/account'
];

// Create an object mapping route patterns to their options
export const routeConfig = {
  '/': {
    dynamic: false,
    protected: true,
    revalidate: 0
  },
  '/account': {
    dynamic: true,
    protected: true,
    revalidate: 0
  },
  '/login': {
    dynamic: true,
    protected: false,
    revalidate: 0
  },
  '/signup': {
    dynamic: true,
    protected: false,
    revalidate: 0
  },
  '/auth/callback': {
    dynamic: true,
    protected: false,
    revalidate: 0
  }
};

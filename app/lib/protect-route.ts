import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';

export function useProtectedRoute() {
  const { isLoading, isLoggedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for initial loading
      if (isLoading) return;

      // If not logged in, redirect to login
      if (!isLoggedIn || !user) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [isLoading, isLoggedIn, user, router]);

  return { isLoading, isLoggedIn, user };
}

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase, supabaseAuth, type Session } from "../lib/supabase"
import { type UserProfile } from "../lib/database-types"
import { AuthError, AuthSession } from '@supabase/supabase-js'

type AuthChangeEvent = 
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'

type AuthContextType = {
  user: UserProfile | null
  isLoading: boolean
  isLoggedIn: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ 
    error: any | null,
    profilePromise?: Promise<void>,
    refreshPromise?: Promise<void>
  }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, isLoggedIn: false })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      setIsLoading(true);
      
      try {
        // First try to get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        // Set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, currentSession: AuthSession | null) => {
          console.log("Auth state changed:", event, !!currentSession);
          
          if (!mounted) return;
          
          if (event === 'SIGNED_OUT') {
            setSession({ user: null, isLoggedIn: false });
            return;
          }
          
          if (currentSession) {
            const { data: userMetadata } = await supabase.auth.getUser();
            setSession({
              user: {
                id: currentSession.user.id,
                email: currentSession.user.email || null,
                name: userMetadata?.user?.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
                user_metadata: userMetadata?.user?.user_metadata || {}
              },
              isLoggedIn: true
            });
          }
        });
        
        // If we have an initial session, set it
        if (session) {
          const { data: userMetadata } = await supabase.auth.getUser();
          if (mounted) {
            setSession({
              user: {
                id: session.user.id,
                email: session.user.email || null,
                name: userMetadata?.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                user_metadata: userMetadata?.user?.user_metadata || {}
              },
              isLoggedIn: true
            });
          }
        } else {
          if (mounted) {
            setSession({ user: null, isLoggedIn: false });
          }
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setSession({ user: null, isLoggedIn: false });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error };
      }
      
      await refreshUser();
      return { error: null };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Normalize the email address to lowercase
      const normalizedEmail = email.toLowerCase().trim();
      
      // Maximum number of retries for signup
      const maxRetries = 2;
      let retryCount = 0;
      let lastError = null;
      
      // Retry loop for signup
      while (retryCount <= maxRetries) {
        try {
          // Set up a timeout for the signup process
          const signupPromise = new Promise(async (resolve, reject) => {
            try {
              // Use the faster auth client for signup
              const { data: { user }, error: signUpError } = await supabaseAuth.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                  data: {
                    name: name, // Store name in user metadata
                  },
                  emailRedirectTo: `${window.location.origin}/auth/callback`
                }
              });
      
              if (signUpError) {
                console.error("Supabase signup error:", signUpError);
                reject(signUpError);
                return;
              }
      
              if (!user) {
                console.error("No user returned from signup");
                reject(new Error("Failed to create user account"));
                return;
              }
              
              resolve(user);
            } catch (error) {
              reject(error);
            }
          });
          
          // Set a timeout for the signup process - increased to 30s
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Signup request timed out')), 30000)
          );
          
          // Race between the signup and the timeout
          const user: any = await Promise.race([signupPromise, timeoutPromise]);
          
          // If we get here, the signup was successful
          
          // Create the user profile in a non-blocking way
          const profilePromise = fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              name,
              email: normalizedEmail
            }),
          }).then(async response => {
            if (!response.ok) {
              const errorData = await response.json();
              console.error("Profile creation failed:", errorData);
              // Don't throw error here, just log it - we want to continue
            }
          }).catch(error => {
            console.error("Profile error:", error);
            // Don't propagate the error - we want to continue
          });
          
          // Start refreshing the user session immediately, don't wait for profile creation
          const refreshPromise = refreshUser();
          
          // Return success immediately, let the profile creation happen in the background
          return { error: null, profilePromise, refreshPromise };
        } catch (error: any) {
          lastError = error;
          
          // Only retry on timeout or network errors
          if (error.message?.includes('timed out') || 
              error.message?.includes('network') ||
              error.name === 'AbortError') {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`Retrying signup after error: ${error.message} (Attempt ${retryCount} of ${maxRetries})`);
              // Wait a bit before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
          } else {
            // For other errors, don't retry
            break;
          }
        }
      }
      
      // If we get here and lastError is not null, all retries failed
      return { error: lastError };
    } catch (error) {
      console.error("Error signing up:", error);
      return { error };
    }
  }

  const signOut = async () => {
    try {
      // First clear all auth storage
      const storageKeys = [
        'app-auth',
        'supabase.auth.token',
        'supabase-auth-token',
        'supabase.auth.refreshToken',
        'redirectPath'
      ];
      
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });

      // Update local state first
      setSession({ user: null, isLoggedIn: false });
      
      // Then sign out from Supabase with timeout
      const signOutPromise = supabaseAuth.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign-out timed out')), 3000)
      );
      
      await Promise.race([signOutPromise, timeoutPromise])
        .catch(error => {
          console.warn("Sign-out timeout or error:", error);
        });

      // Force refresh the page to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Error during sign-out:", error);
      throw error; // Let the component handle the error
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (!session) {
        setSession({ user: null, isLoggedIn: false });
        return;
      }
      
      const { data: userMetadata } = await supabase.auth.getUser();
      
      setSession({ 
        user: {
          id: session.user.id,
          email: session.user.email || null,
          name: userMetadata?.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          user_metadata: userMetadata?.user?.user_metadata || {}
        },
        isLoggedIn: true
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setSession({ user: null, isLoggedIn: false });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        isLoading,
        isLoggedIn: session.isLoggedIn,
        signIn,
        signUp,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

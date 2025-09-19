"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase, supabaseAuth, type Session } from "../lib/supabase"
import { type UserProfile } from "../lib/database-types"

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
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (!session) {
          setSession({ user: null, isLoggedIn: false });
          setIsLoading(false);
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
        console.error("Error initializing auth:", error);
        setSession({ user: null, isLoggedIn: false });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      refreshUser();
    });

    return () => {
      subscription.unsubscribe();
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
      
      // Set a timeout for the signup process
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup request timed out')), 5000)
      );
      
      // Race between the signup and the timeout
      const user: any = await Promise.race([signupPromise, timeoutPromise]);
      
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
    } catch (error) {
      console.error("Error signing up:", error);
      return { error };
    }
  }

  const signOut = async () => {
    try {
      // Use the faster auth client for sign-out
      // Set a timeout for the sign-out process
      const signOutPromise = supabaseAuth.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign-out timed out')), 3000)
      );
      
      // Race between the sign-out and the timeout
      await Promise.race([signOutPromise, timeoutPromise])
        .catch(error => {
          console.warn("Sign-out timeout or error:", error);
          // Continue anyway
        });
    } catch (error) {
      console.error("Error during sign-out:", error);
      // Continue anyway, we still want to clear local state
    } finally {
      // Always update local state, even if the server request fails
      setSession({ user: null, isLoggedIn: false });
      
      // Clear any cached data
      localStorage.removeItem("supabase.auth.token");
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

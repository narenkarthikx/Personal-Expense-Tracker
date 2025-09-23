"use client"

// We'll handle client-side auth without server exports

import { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut, UserCircle } from "lucide-react"
import { supabase } from "../lib/supabase"

// Loading fallback component
function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading account information...</p>
      </div>
    </div>
  )
}

// The main account page component
function AccountContent() {
  const { user, isLoading, isLoggedIn, signOut, refreshUser } = useAuth()
  const router = useRouter()

  // Use local state to track authentication check
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    console.log("Account page auth state:", { isLoading, isLoggedIn, user })
    
    const checkAuth = async () => {
      if (isLoading) return;
      
      // If already logged in, set as authenticated
      if (isLoggedIn && user) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      
      // Add an extra check to refresh the auth state
      try {
        await refreshUser();
        // After refresh, check if we're logged in
        if (isLoggedIn && user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error refreshing user in account page:", error);
        setIsAuthenticated(false);
      }
      
      setAuthChecked(true);
    };
    
    checkAuth();
  }, [isLoading, isLoggedIn, user, refreshUser]);

  // Only redirect after auth check is complete
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.push("/login");
    }
  }, [authChecked, isAuthenticated, router]);

  // Force a refresh of the auth state when the component mounts
  useEffect(() => {
    const forceRefresh = async () => {
      try {
        // First try to get the session using Supabase directly
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Direct session check:", session);
        
        // Then try to refresh through the auth context
        const refreshed = await refreshUser();
        console.log("Refresh result:", refreshed);
        
        // Update our local state based on the results
        if (session || refreshed) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error in force refresh:", error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    forceRefresh();
  }, []);

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  // Show loading state
  if (isLoading) {
    return <AccountLoading />
  }

  // Safety check - don't render if not logged in
  if (!isLoggedIn && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
        <div className="text-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your account...</p>
        </div>
        <Button 
          variant="outline" 
          onClick={async () => {
            await refreshUser();
            setAuthChecked(true);
          }}
        >
          Refresh Login Status
        </Button>
        <Button 
          variant="link" 
          onClick={() => router.push("/login")}
          className="mt-2"
        >
          Return to Login
        </Button>
      </div>
    );
  }

  // This will only render client-side after the useEffect check
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserCircle className="w-6 h-6" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your account preferences and profile.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="font-medium">{user?.name || 'User'}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// Main export - wrap everything in Suspense
export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent />
    </Suspense>
  )
}

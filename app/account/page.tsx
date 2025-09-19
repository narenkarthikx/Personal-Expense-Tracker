"use client"

// Tell Next.js to never pre-render this page
export const dynamic = 'force-dynamic'
export const revalidate = 0
// Add runtime for safe server rendering
export const runtime = 'edge'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut, UserCircle } from "lucide-react"

export default function AccountPage() {
  const { user, isLoading, isLoggedIn, signOut } = useAuth()
  const router = useRouter()

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login")
    }
  }, [isLoading, isLoggedIn, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
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

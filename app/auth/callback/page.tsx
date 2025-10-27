"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the hash params
      const hashParams = window.location.hash
        .substring(1)
        .split("&")
        .reduce((params, param) => {
          const [key, value] = param.split("=")
          params[key] = value
          return params
        }, {} as Record<string, string>)

      // Process auth callback
      try {
        // Get return URL from localStorage if it exists
        const returnUrl = localStorage.getItem('redirectPath') || '/'
        localStorage.removeItem('redirectPath') // Clean up

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(hashParams.access_token || window.location.hash)
        
        if (error) {
          throw error
        }

        if (data?.session) {
          // Wait a moment for auth state to update
          await new Promise(resolve => setTimeout(resolve, 500))
          // Redirect to the saved return URL
          router.push(returnUrl)
        } else {
          throw new Error('No session returned')
        }
      } catch (error) {
        console.error("Error processing auth callback:", error)
        router.push("/login?error=" + encodeURIComponent(error instanceof Error ? error.message : 'callback_error'))
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  )
}

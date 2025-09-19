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
        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(hashParams.access_token || window.location.hash)

        // Redirect to the home page
        router.push("/")
      } catch (error) {
        console.error("Error processing auth callback:", error)
        router.push("/login?error=callback_error")
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

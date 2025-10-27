"use client"

import { useAuth } from "@/app/context/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function withAuth(WrappedComponent: React.ComponentType) {
  return function WithAuthWrapper(props: any) {
    const { isLoggedIn, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isLoggedIn) {
        router.replace('/login')
      }
    }, [isLoading, isLoggedIn, router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isLoggedIn) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}

"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2 transition-all ${
        isOnline
          ? "bg-green-500 text-white transform -translate-y-full"
          : "bg-red-500 text-white transform translate-y-0"
      }`}
    >
      {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      {isOnline ? "Back online! Data synced." : "You're offline. Changes will sync when connection is restored."}
    </div>
  )
}

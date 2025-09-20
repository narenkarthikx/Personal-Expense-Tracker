"use client"

import { useState, useEffect } from "react"
import { Plus, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt more quickly on mobile devices
      const showDelay = window.innerWidth < 768 ? 1500 : 5000 // 1.5 seconds on mobile, 5 on desktop
      
      // Clear previous timeout if any
      const timeoutId = setTimeout(() => {
        // Check if app is not in standalone mode and prompt hasn't been dismissed
        if (!window.matchMedia('(display-mode: standalone)').matches && 
            !localStorage.getItem("installPromptDismissed")) {
          setShowPrompt(true)
          console.log("Showing install prompt")
        }
      }, showDelay)
      
      return () => clearTimeout(timeoutId)
    }

    window.addEventListener("beforeinstallprompt", handler)
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false)
    } else {
      // Force showing prompt for testing (remove in production)
      setTimeout(() => {
        if (!localStorage.getItem("installPromptDismissed")) {
          setShowPrompt(true)
          console.log("Forcing install prompt")
        }
      }, 3000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("installPromptDismissed", "true")
  }

  // If already installed or not available, don't show
  if (!showPrompt || window.matchMedia('(display-mode: standalone)').matches) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">📱 Install Mexo App</h3>
              <p className="text-sm text-blue-700 mb-2">
                Add to your home screen for offline use:
              </p>
              <ul className="text-xs text-blue-600 mb-3 pl-2">
                <li>• Quick access anytime</li>
                <li>• Works without internet</li>
                <li>• Better experience</li>
              </ul>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1" />
                  Install Now
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="ml-auto">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

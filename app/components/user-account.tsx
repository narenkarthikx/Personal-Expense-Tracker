"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"

export function UserAccount() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true);
    
    try {
      // Start sign-out process but don't wait for it to complete
      const signOutPromise = signOut();
      
      // Immediately redirect to login page
      router.push("/login");
      
      // Let the sign-out process complete in the background
      signOutPromise.catch(error => {
        console.error("Error during sign-out:", error);
        // Error is handled, nothing more to do here
      });
    } catch (error) {
      console.error("Error initiating sign-out:", error);
      setIsSigningOut(false);
    }
  }

  if (!user) {
    return (
      <Button variant="outline" onClick={() => router.push("/login")}>
        Sign in
      </Button>
    )
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
          <Avatar>
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/account")}
        >
          <User className="w-4 h-4 mr-2" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

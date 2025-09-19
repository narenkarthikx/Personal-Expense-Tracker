"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../context/auth-context"
import ProtectedLayout from "../components/protected-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Lock, ArrowLeft, Check, AlertTriangle } from "lucide-react"
import { supabase } from "../lib/supabase"

export default function AccountSettings() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
      
      // Try to get user metadata if available
      if (user.user_metadata && user.user_metadata.name) {
        setName(user.user_metadata.name)
      }
    }
  }, [user])

  const updateProfile = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setMessage({ type: "", text: "" })
      
      const { error } = await supabase.auth.updateUser({
        data: { name }
      })
      
      if (error) throw error
      
      setMessage({ 
        type: "success", 
        text: "Profile updated successfully" 
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update profile" 
      })
    } finally {
      setLoading(false)
    }
  }
  
  const updatePassword = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setMessage({ type: "", text: "" })
      
      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "New passwords don't match" })
        return
      }
      
      if (newPassword.length < 6) {
        setMessage({ type: "error", text: "Password must be at least 6 characters" })
        return
      }
      
      // First sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword
      })
      
      if (signInError) {
        setMessage({ type: "error", text: "Current password is incorrect" })
        return
      }
      
      // Then update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      
      setMessage({ 
        type: "success", 
        text: "Password updated successfully" 
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to update password" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    if (!confirm("Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.")) {
      return
    }
    
    try {
      setLoading(true)
      setMessage({ type: "", text: "" })
      
      // Delete user data first
      const { error: dataError } = await supabase.rpc('delete_user_data', {
        user_id_input: user.id
      })
      
      if (dataError) throw dataError
      
      // Then delete the account
      await signOut()
      
      router.push("/login?deleted=true")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      setMessage({ 
        type: "error", 
        text: error.message || "Failed to delete account" 
      })
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        {message.text && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={email} 
                  disabled 
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={updateProfile}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password"
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={updatePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader className="text-red-800">
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription className="text-red-600">
                Permanent actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Deleting your account will permanently remove all your data, including expenses, budgets, and categories. This action cannot be undone.
              </p>
              <Button 
                onClick={handleDeleteAccount}
                disabled={loading}
                variant="destructive"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}

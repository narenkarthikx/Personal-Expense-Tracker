"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupStage, setSignupStage] = useState<'idle' | 'creating' | 'redirecting'>('idle')
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Improved email validation regex that allows more valid email formats
    // This is more permissive than the previous regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setIsSubmitting(true);
    setSignupStage('creating');

    try {
      // Start sign-up process
      const { error: signUpError, profilePromise, refreshPromise } = await signUp(email, password, name);
      
      if (signUpError) {
        console.error("Signup error details:", signUpError);
        setIsSubmitting(false);
        setSignupStage('idle');
        
        // Handle specific error codes
        if (signUpError.message?.includes("email")) {
          setError(`Email error: ${signUpError.message}`);
        } else if (signUpError.message?.toLowerCase().includes("invalid email")) {
          setError("The email format appears to be invalid. Please use a valid email address.");
        } else if (signUpError.message?.includes("already registered")) {
          setError("This email is already registered. Please try signing in instead.");
        } else if (signUpError.message?.includes("timed out")) {
          setError("The sign-up request is taking longer than expected. This may be due to a slow connection. Please try again.");
        } else {
          setError(signUpError.message || "Failed to create account. Please try again.");
        }
      } else {
        // Update UI state immediately
        setSignupStage('redirecting');
        
        // Short delay to show the redirecting state
        setTimeout(() => {
          // Immediately redirect to dashboard while background processes finish
          router.push("/");
        
          // Let the background processes complete
          if (profilePromise) profilePromise.catch(console.error);
          if (refreshPromise) refreshPromise.catch(console.error);
        }, 500); // Just enough delay to show the user we're redirecting
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
      setIsSubmitting(false)
      setSignupStage('idle')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full mb-4" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {signupStage === 'idle' && "Create account"}
              {signupStage === 'creating' && "Creating account..."}
              {signupStage === 'redirecting' && "Success! Redirecting..."}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

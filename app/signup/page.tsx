"use client"

// We'll handle client-side auth without server exports

import { useState, useEffect } from "react"
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
  const [signupStage, setSignupStage] = useState<'idle' | 'creating' | 'email-verification' | 'redirecting'>('idle')
  const router = useRouter()
  const { signUp, isLoggedIn } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/')
    }
  }, [isLoggedIn, router])

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
      const { error: signUpError, profilePromise, refreshPromise, emailConfirmationRequired } = await signUp(email, password, name);
      
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
          setError("The sign-up request is taking longer than expected. Please try using a different email or check your internet connection.");
        } else {
          setError(signUpError.message || "Failed to create account. Please try again.");
        }
      } else if (emailConfirmationRequired) {
        // If email confirmation is required, show a different message
        setSignupStage('email-verification');
        setIsSubmitting(false);
      } else {
        // Update UI state immediately
        setSignupStage('redirecting');
        
        // Short delay to show the redirecting state
        setTimeout(() => {
          // Redirect to onboarding page instead of dashboard
          router.push("/onboarding");
        
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
          <h1 className="text-center text-3xl font-bold text-primary mb-2">Mexo Expense Tracker</h1>
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
            {signupStage === 'email-verification' && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  <p className="font-medium">Check your email!</p>
                  <p>We've sent a verification link to {email}. Please check your inbox and click the link to complete your registration.</p>
                </AlertDescription>
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
                disabled={signupStage === 'email-verification'}
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
                disabled={signupStage === 'email-verification'}
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
                disabled={signupStage === 'email-verification'}
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
                disabled={signupStage === 'email-verification'}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button 
              type="submit" 
              className="w-full mb-4" 
              disabled={isSubmitting || signupStage === 'email-verification'}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {signupStage === 'idle' && "Create account"}
              {signupStage === 'creating' && "Creating account..."}
              {signupStage === 'email-verification' && "Check your email"}
              {signupStage === 'redirecting' && "Success! Redirecting..."}
            </Button>
            {signupStage === 'email-verification' && (
              <Button 
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={() => setSignupStage('idle')}
              >
                Try with a different email
              </Button>
            )}
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Plus, ArrowRight } from "lucide-react"
import { useAuth } from "../context/auth-context"
import { supabase } from "../lib/supabase"

export default function OnboardingPage() {
  const [categories, setCategories] = useState<string[]>([
    "Groceries", "Dining", "Transport", "Shopping", "Utilities", "Entertainment"
  ])
  const [newCategory, setNewCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useAuth()

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, isLoading, router])

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category))
  }

  const handleSubmit = async () => {
    if (categories.length === 0) return
    
    setIsSubmitting(true)
    
    try {
      // Save categories to database
      for (const category of categories) {
        await supabase.from("categories").upsert(
          { user_id: user?.id, name: category },
          { onConflict: "user_id,name" }
        )
      }
      
      // Redirect to main app
      router.push("/")
    } catch (error) {
      console.error("Error saving categories:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Mexo!</CardTitle>
            <CardDescription>
              Let's set up your expense categories to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-category">Add Custom Categories</Label>
              <div className="flex mt-1.5">
                <Input
                  id="new-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Rent, Medical, Education"
                  className="flex-1"
                />
                <Button 
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  className="ml-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Your Categories</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-gray-500 text-sm">No categories added yet</p>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || categories.length === 0}
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

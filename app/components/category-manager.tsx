"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "../lib/supabase"
import { useIsMobile } from "@/hooks/use-mobile"

// Default categories that will be used if user has no categories
const DEFAULT_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Transportation",
  "Bills & Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Housing",
  "Travel",
  "Education",
  "Personal Care",
  "Gifts & Donations",
  "Miscellaneous"
]

interface CategoryManagerProps {
  categories: string[]
  onClose: () => void
  onCategoriesUpdated: () => void
}

export function CategoryManager({ categories, onClose, onCategoriesUpdated }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from("categories").insert([{ name: newCategory.trim() }])
      if (error) throw error

      setNewCategory("")
      onCategoriesUpdated()
    } catch (error) {
      console.error("Error adding category:", error)
      alert("Error adding category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) return

    setLoading(true)
    try {
      const { error } = await supabase.from("categories").delete().eq("name", categoryName)
      if (error) throw error

      onCategoriesUpdated()
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Error deleting category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreDefaults = async () => {
    if (!confirm("This will add default categories to your list. Continue?")) return

    setLoading(true)
    try {
      const categoriesToAdd = DEFAULT_CATEGORIES.filter(
        category => !categories.includes(category)
      )

      if (categoriesToAdd.length === 0) {
        alert("All default categories are already in your list!")
        setLoading(false)
        return
      }

      const { error } = await supabase.from("categories").insert(
        categoriesToAdd.map(name => ({ name }))
      )
      
      if (error) throw error
      onCategoriesUpdated()
      alert(`Added ${categoriesToAdd.length} default categories.`)
    } catch (error) {
      console.error("Error restoring defaults:", error)
      alert("Error restoring default categories. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Initialize default categories if there are none
  useEffect(() => {
    const initializeDefaultCategories = async () => {
      if (categories.length === 0) {
        setLoading(true)
        try {
          const { error } = await supabase.from("categories").insert(
            DEFAULT_CATEGORIES.map(name => ({ name }))
          )
          
          if (error) throw error
          onCategoriesUpdated()
        } catch (error) {
          console.error("Error initializing categories:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    initializeDefaultCategories()
  }, [categories.length, onCategoriesUpdated])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className={`w-full ${isMobile ? 'max-w-[95%]' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>⚙️ Manage Categories</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Category */}
          <div className="space-y-2">
            <Label htmlFor="newCategory">Add New Category</Label>
            <div className="flex gap-2">
              <Input
                id="newCategory"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Existing Categories */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Your Categories ({categories.length})</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestoreDefaults} 
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Add Defaults
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{category}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {loading ? "Setting up default categories..." : "No categories found"}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">💡 Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Keep categories simple and specific</li>
              <li>• Use consistent naming</li>
              <li>• Avoid too many categories</li>
              <li>• Customize to match your spending habits</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

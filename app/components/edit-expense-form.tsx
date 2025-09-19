"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "../lib/supabase"
import type { Expense } from "../page"

interface EditExpenseFormProps {
  expense: Expense
  onClose: () => void
  onExpenseUpdated: () => void
  categories: string[]
  userId?: string
}

export function EditExpenseForm({ expense, onClose, onExpenseUpdated, categories, userId }: EditExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: expense.amount.toString(),
    category: expense.category,
    description: expense.description,
    date: expense.date,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setErrors({})

    const newErrors: { amount?: string; category?: string } = {}
    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }
    if (!formData.category) {
      newErrors.category = "Please select a category"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          amount: Number.parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          user_id: userId || expense.user_id
        })
        .eq("id", expense.id)

      if (error) throw error
      onExpenseUpdated()
    } catch (error) {
      console.error("Error updating expense:", error)
      alert("Error updating expense. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Edit Expense</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                required
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a note about this expense..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.amount || !formData.category} className="flex-1">
                {loading ? "Updating..." : "Update Expense"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

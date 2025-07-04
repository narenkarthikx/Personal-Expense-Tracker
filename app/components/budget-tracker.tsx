"use client"

import { useState } from "react"
import { Plus, Target, TrendingUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { supabase } from "../lib/supabase"
import type { Expense, Budget } from "../page"

interface BudgetTrackerProps {
  expenses: Expense[]
  budgets: Budget[]
  categories: string[]
  onBudgetUpdated: () => void
}

export function BudgetTracker({ expenses, budgets, categories, onBudgetUpdated }: BudgetTrackerProps) {
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: "",
    amount: "",
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
  })

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const categorySpending = currentMonthExpenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const currentBudgets = budgets.filter(
    (budget) => budget.month === currentMonth.toString() && budget.year === currentYear,
  )

  const handleAddBudget = async () => {
    if (!newBudget.category || !newBudget.amount) return

    try {
      const { error } = await supabase.from("budgets").insert([
        {
          category: newBudget.category,
          amount: Number.parseFloat(newBudget.amount),
          month: newBudget.month,
          year: Number.parseInt(newBudget.year),
        },
      ])

      if (error) throw error

      setNewBudget({
        category: "",
        amount: "",
        month: new Date().getMonth().toString(),
        year: new Date().getFullYear().toString(),
      })
      setShowAddBudget(false)
      onBudgetUpdated()
    } catch (error) {
      console.error("Error adding budget:", error)
      alert("Error adding budget. Please try again.")
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return

    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id)
      if (error) throw error
      onBudgetUpdated()
    } catch (error) {
      console.error("Error deleting budget:", error)
      alert("Error deleting budget. Please try again.")
    }
  }

  const totalBudget = currentBudgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)
  const remainingBudget = totalBudget - totalSpent

  return (
    <div className="space-y-6">
      {/* Overall Budget Summary */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />Budget Overview -{" "}
              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </CardTitle>
            <Button onClick={() => setShowAddBudget(true)} size="sm" className="w-full sm:w-auto sm:self-end">
              <Plus className="w-4 h-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{totalBudget.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">₹{totalSpent.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
                ₹{remainingBudget.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
          </div>

          {totalBudget > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{((totalSpent / totalBudget) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(totalSpent / totalBudget) * 100} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentBudgets.map((budget) => {
          const spent = categorySpending[budget.category] || 0
          const percentage = (spent / budget.amount) * 100
          const isOverBudget = spent > budget.amount

          return (
            <Card key={budget.id} className={isOverBudget ? "border-red-200 bg-red-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <div className="flex items-center gap-2">
                    {isOverBudget && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>₹{spent.toFixed(2)} spent</span>
                    <span>₹{budget.amount.toFixed(2)} budget</span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className={`h-2 ${isOverBudget ? "bg-red-200" : ""}`} />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span className={isOverBudget ? "text-red-600 font-semibold" : "text-green-600"}>
                      {isOverBudget
                        ? `₹${(spent - budget.amount).toFixed(2)} over`
                        : `₹${(budget.amount - spent).toFixed(2)} left`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Budget Form */}
      {showAddBudget && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => setShowAddBudget(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddBudget} disabled={!newBudget.category || !newBudget.amount} className="flex-1">
                Add Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />💡 Budget Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🎯 Setting Budgets:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use the 50/30/20 rule</li>
                <li>• Track for 2-3 months first</li>
                <li>• Set realistic goals</li>
                <li>• Review monthly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚠️ Staying on Track:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Check progress weekly</li>
                <li>• Adjust if needed</li>
                <li>• Plan for unexpected expenses</li>
                <li>• Celebrate small wins</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

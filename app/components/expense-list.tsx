"use client"

import { useState } from "react"
import { Trash2, Calendar, Tag, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "../lib/supabase"
import type { Expense } from "../page"

interface ExpenseListProps {
  expenses: Expense[]
  onExpenseDeleted: () => void
  onExpenseEdit: (expense: Expense) => void
  viewType: "daily" | "all"
  selectedMonth?: number
  selectedYear?: number
}

export function ExpenseList({ expenses, onExpenseDeleted, onExpenseEdit, viewType, selectedMonth, selectedYear }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)
      if (error) throw error
      onExpenseDeleted()
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Error deleting expense. Please try again.")
    }
  }

  let filteredExpenses = expenses

  // First, filter by month/year if provided
  if (selectedMonth !== undefined && selectedYear !== undefined) {
    filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
    });
  }
  
  if (viewType === "daily") {
    const today = new Date().toISOString().split("T")[0]
    filteredExpenses = filteredExpenses.filter((expense) => expense.date === today)
  }

  if (searchTerm) {
    filteredExpenses = filteredExpenses.filter(
      (expense) =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  if (categoryFilter !== "all") {
    filteredExpenses = filteredExpenses.filter((expense) => expense.category === categoryFilter)
  }

  const categories = [...new Set(expenses.map((expense) => expense.category))]

  const groupedExpenses = filteredExpenses.reduce(
    (groups, expense) => {
      const date = expense.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(expense)
      return groups
    },
    {} as Record<string, Expense[]>,
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Format as DD-MM-YYYY with day name
    const formattedDate = `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`

    if (dateString === today.toISOString().split("T")[0]) {
      return `Today (${formattedDate})`
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return `Yesterday (${formattedDate})`
    } else {
      return formattedDate
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{viewType === "daily" ? "Today's Expenses" : "All Expenses"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      {Object.keys(groupedExpenses).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No expenses found. Add your first expense!</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedExpenses)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)

            return (
              <Card key={date}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(date)}
                    </CardTitle>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">₹{dayTotal.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 text-right">{dayExpenses.length} transaction{dayExpenses.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm text-blue-600">{expense.category}</span>
                        </div>
                        <div className="mb-1">
                          {expense.description ? (
                            <p className="text-sm text-gray-600">{expense.description}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No description</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:gap-3 text-xs text-gray-500">
                          <p>
                            <span className="font-semibold">Transaction Date:</span> {new Date(expense.date).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }).replace(/\//g, '-')}
                          </p>
                          <p>
                            <span className="font-semibold">Added:</span> {new Date(expense.created_at).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            }).replace(/\//g, '-')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">₹{expense.amount.toFixed(2)}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExpenseEdit(expense)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })
      )}
    </div>
  )
}

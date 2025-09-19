"use client"

import { useState, useEffect } from "react"
import { Trash2, Calendar, Tag, Edit, ListFilter, X, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { supabase } from "../lib/supabase"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Expense } from "../page"

interface ExpenseListProps {
  expenses: Expense[]
  onExpenseDeleted: () => void
  onExpenseEdit: (expense: Expense) => void
  viewType: "daily" | "all"
}

export function ExpenseList({ expenses, onExpenseDeleted, onExpenseEdit, viewType }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useIsMobile()
  const [compactView, setCompactView] = useState(false)

  // Set compact view for mobile automatically
  useEffect(() => {
    setCompactView(isMobile)
  }, [isMobile])

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

  if (viewType === "daily") {
    const today = new Date().toISOString().split("T")[0]
    filteredExpenses = expenses.filter((expense) => expense.date === today)
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

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today"
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday"
    } else {
      // Use a shorter format for mobile
      return isMobile 
        ? date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            weekday: "short"
          })
        : date.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
    }
  }

  // Count total number of expenses
  const totalExpenseCount = Object.values(groupedExpenses).reduce(
    (sum, expenses) => sum + expenses.length, 
    0
  )

  return (
    <div className={`space-y-4 ${compactView ? 'mobile-compact-view' : ''}`}>
      {/* Mobile Filters Toggle */}
      {isMobile && (
        <div className="flex justify-between items-center mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs flex items-center"
          >
            {showFilters ? (
              <>
                <X className="w-3 h-3 mr-1" />
                Hide Filters
              </>
            ) : (
              <>
                <ListFilter className="w-3 h-3 mr-1" />
                Show Filters
              </>
            )}
          </Button>
          
          <span className="text-xs text-gray-500">
            {totalExpenseCount} {totalExpenseCount === 1 ? 'expense' : 'expenses'}
          </span>
        </div>
      )}

      {/* Filters */}
      <Card className={isMobile && !showFilters ? 'hidden' : ''}>
        <CardHeader className={compactView ? 'pb-2' : 'pb-4'}>
          <CardTitle className={compactView ? "text-base" : "text-lg"}>
            {viewType === "daily" ? "Today's Expenses" : "All Expenses"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={compactView ? 'h-8 text-sm' : ''}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={compactView ? 'h-8 text-sm' : ''}>
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
                <CardHeader className={compactView ? 'py-2 px-3' : 'pb-3'}>
                  <div className="flex justify-between items-center">
                    <CardTitle className={compactView ? 'text-sm flex items-center gap-1' : 'text-lg flex items-center gap-2'}>
                      <Calendar className={compactView ? 'w-3 h-3' : 'w-4 h-4'} />
                      {formatDate(date)}
                    </CardTitle>
                    <div className={compactView ? 'text-base font-semibold text-blue-600' : 'text-lg font-semibold text-blue-600'}>
                      ₹{dayTotal.toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={compactView ? 'py-1 px-3 space-y-2' : 'space-y-3'}>
                  {dayExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className={compactView ? 'w-3 h-3 text-gray-500' : 'w-4 h-4 text-gray-500'} />
                          <span className={compactView ? 'font-medium text-xs text-blue-600 truncate' : 'font-medium text-sm text-blue-600'}>
                            {expense.category}
                          </span>
                        </div>
                        {expense.description && (
                          <p className={compactView ? 'text-xs text-gray-600 mb-1 truncate' : 'text-sm text-gray-600 mb-1'}>
                            {expense.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(expense.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={compactView ? 'font-semibold text-base' : 'font-semibold text-lg'}>
                          ₹{expense.amount.toFixed(2)}
                        </span>
                        
                        {isMobile ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onExpenseEdit(expense)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(expense.id)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
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
                        )}
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

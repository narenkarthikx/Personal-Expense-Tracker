"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, Calendar, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddExpenseForm } from "./components/add-expense-form"
import { EditExpenseForm } from "./components/edit-expense-form"
import { ExpenseList } from "./components/expense-list"
import { ExpenseSummary } from "./components/expense-summary"
import { MonthlyView } from "./components/monthly-view"
import { ExportData } from "./components/export-data"
import { BudgetTracker } from "./components/budget-tracker"
import { CategoryManager } from "./components/category-manager"
import { OfflineIndicator } from "./components/offline-indicator"
import { InstallPrompt } from "./components/install-prompt"
import { UserAccount } from "./components/user-account"
import ProtectedLayout from "./components/protected-layout"
import { supabase } from "./lib/supabase"
import { useAuth } from "./context/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  created_at: string
  user_id?: string | null
}

export interface Budget {
  id: string
  category: string
  amount: number
  month: string
  year: number
  created_at: string
  user_id?: string | null
}

export default function ExpenseTracker() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ]

  // Get current year and the past 3 years for the dropdown
  const availableYears = [
    selectedYear + 1,
    selectedYear,
    selectedYear - 1,
    selectedYear - 2,
  ]

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, selectedMonth, selectedYear])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Calculate start and end dates for the selected month
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
      let endDate
      if (selectedMonth === 11) {
        endDate = new Date(selectedYear + 1, 0, 0).toISOString().split('T')[0]
      } else {
        endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]
      }

      const [expensesResult, budgetsResult, categoriesResult, allExpensesResult] = await Promise.all([
        // Fetch expenses for the selected month
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false }),
        
        // Fetch budgets for the selected month
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .eq("month", months[selectedMonth].toLowerCase())
          .eq("year", selectedYear),
        
        // Fetch all categories for the user
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("name"),
          
        // Fetch all expenses for analytics (limited to last 6 months for performance)
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0])
          .order("date", { ascending: false }),
      ])

      if (expensesResult.error) throw expensesResult.error
      if (budgetsResult.error) throw budgetsResult.error
      if (categoriesResult.error) throw categoriesResult.error
      if (allExpensesResult.error) throw allExpensesResult.error

      // Use proper type casting with unknown as intermediary
      setExpenses((expensesResult.data as unknown as Expense[]) || [])
      setBudgets((budgetsResult.data as unknown as Budget[]) || [])
      setCategories((categoriesResult.data as unknown as any[])?.map(c => c.name) || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseAdded = () => {
    fetchData()
    setShowAddForm(false)
  }

  const handleExpenseUpdated = () => {
    fetchData()
    setShowEditForm(false)
    setEditingExpense(null)
  }

  const handleExpenseDeleted = () => {
    fetchData()
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowEditForm(true)
  }

  const handleBudgetUpdated = () => {
    fetchData()
  }

  const handleCategoriesUpdated = () => {
    fetchData()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  const todayExpenses = expenses.filter((expense) => {
    const today = new Date().toISOString().split("T")[0]
    return expense.date === today
  })

  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <OfflineIndicator />
        <InstallPrompt />
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mexo - My Expenses Optimized</h1>
              <p className="text-gray-600 mt-1">Expenses Managed with budgets & analytics</p>
            </div>
            <div className="flex items-center gap-2">
              <UserAccount />
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="hidden sm:flex"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>

          {/* Month Selection */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{todayTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {todayExpenses.length} transaction{todayExpenses.length !== 1 ? "s" : ""} today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{months[selectedMonth]} {selectedYear}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{monthlyTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {expenses.length} transaction{expenses.length !== 1 ? "s" : ""} this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="summary">Analytics</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your expenses...</p>
              </div>
            ) : (
              <>
                <TabsContent value="daily" className="space-y-4">
                  <ExpenseList
                    expenses={expenses}
                    onExpenseDeleted={handleExpenseDeleted}
                    onExpenseEdit={handleEditExpense}
                    viewType="daily"
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </TabsContent>

                <TabsContent value="monthly" className="space-y-4">
                  <MonthlyView 
                    expenses={expenses}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                  <ExpenseSummary 
                    expenses={expenses}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </TabsContent>

                <TabsContent value="budget" className="space-y-4">
                  <BudgetTracker
                    expenses={expenses}
                    budgets={budgets}
                    categories={categories}
                    onBudgetUpdated={handleBudgetUpdated}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  <ExportData 
                    expenses={expenses}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* Modals */}
          {showAddForm && (
            <AddExpenseForm
              onClose={() => setShowAddForm(false)}
              onExpenseAdded={handleExpenseAdded}
              categories={categories}
              userId={user?.id}
              selectedDate={new Date(selectedYear, selectedMonth, new Date().getDate())}
            />
          )}

          {showEditForm && editingExpense && (
            <EditExpenseForm
              expense={editingExpense}
              onClose={() => {
                setShowEditForm(false)
                setEditingExpense(null)
              }}
              onExpenseUpdated={handleExpenseUpdated}
              categories={categories}
              userId={user?.id}
            />
          )}

          {showSettings && (
            <CategoryManager
              categories={categories}
              onClose={() => setShowSettings(false)}
              onCategoriesUpdated={handleCategoriesUpdated}
              userId={user?.id}
            />
          )}
        </div>
      </div>
    </ProtectedLayout>
  )
}

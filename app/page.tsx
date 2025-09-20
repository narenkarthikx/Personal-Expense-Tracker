"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, Calendar, Settings, Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
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
import { supabase } from "./lib/supabase"
import { useIsMobile } from "@/hooks/use-mobile"

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  created_at: string
}

export interface Budget {
  id: string
  category: string
  amount: number
  month: string
  year: number
  created_at: string
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()

  // Set compact view automatically on mobile
  useEffect(() => {
    setCompactView(isMobile)
  }, [isMobile])

  useEffect(() => {
    fetchData()
    
    // Apply compact class to body
    if (compactView) {
      document.body.classList.add('mobile-compact-view')
    } else {
      document.body.classList.remove('mobile-compact-view')
    }
    
    return () => {
      document.body.classList.remove('mobile-compact-view')
    }
  }, [compactView])

  const fetchData = async () => {
    try {
      const [expensesResult, budgetsResult, categoriesResult] = await Promise.all([
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("budgets").select("*"),
        supabase.from("categories").select("*").order("name"),
      ])

      if (expensesResult.error) throw expensesResult.error
      if (budgetsResult.error) throw budgetsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      setExpenses(expensesResult.data || [])
      setBudgets(budgetsResult.data || [])
      setCategories(categoriesResult.data?.map((c: { name: string }) => c.name) || [])
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

  const todayExpenses = expenses.filter((expense) => {
    const today = new Date().toISOString().split("T")[0]
    return expense.date === today
  })

  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const thisMonthExpenses = expenses.filter((expense) => {
    const now = new Date()
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  })

  const monthlyTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${compactView ? 'mobile-compact-view' : ''}`}>
      <OfflineIndicator />
      <InstallPrompt />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
          <div>
            <h1 className={`${compactView ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
              Mexo - My Expenses Optimized
            </h1>
            <p className={`text-gray-600 mt-1 ${compactView ? 'text-xs' : ''}`}>
              Expenses Managed with budgets & analytics
            </p>
          </div>
          <div className="flex flex-row gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`${compactView ? 'h-10 w-10 p-2' : 'h-9'}`}
                >
                  <Settings className={`${compactView ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
                  {compactView ? '' : 'Settings'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  Manage Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isMobile && (
                  <DropdownMenuItem className="flex justify-between" onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center gap-2">
                      {compactView ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                      <span>Compact View</span>
                    </div>
                    <Switch 
                      checked={compactView} 
                      onCheckedChange={setCompactView}
                    />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              onClick={() => setShowAddForm(true)}
              className={`bg-blue-600 hover:bg-blue-700 ${compactView ? 'h-10 p-2' : ''}`}
            >
              <Plus className={`${compactView ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
              {compactView ? 'Add' : 'Add Expense'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${compactView ? 'py-2 px-3' : 'pb-2'}`}>
              <CardTitle className={compactView ? "text-xs font-medium" : "text-sm font-medium"}>Today's Expenses</CardTitle>
              <Calendar className={compactView ? "h-3 w-3 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
            </CardHeader>
            <CardContent className={compactView ? "py-2 px-3" : ""}>
              <div className={compactView ? "text-xl font-bold" : "text-2xl font-bold"}>₹{todayTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {todayExpenses.length} transaction{todayExpenses.length !== 1 ? "s" : ""} today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${compactView ? 'py-2 px-3' : 'pb-2'}`}>
              <CardTitle className={compactView ? "text-xs font-medium" : "text-sm font-medium"}>This Month</CardTitle>
              <TrendingUp className={compactView ? "h-3 w-3 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
            </CardHeader>
            <CardContent className={compactView ? "py-2 px-3" : ""}>
              <div className={compactView ? "text-xl font-bold" : "text-2xl font-bold"}>₹{monthlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {thisMonthExpenses.length} transaction{thisMonthExpenses.length !== 1 ? "s" : ""} this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className={`grid w-full ${compactView ? 'text-xs' : ''} grid-cols-5`}>
            <TabsTrigger value="daily">{compactView ? 'Today' : 'Daily'}</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="summary">{compactView ? 'Stats' : 'Analytics'}</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <ExpenseList
              expenses={expenses}
              onExpenseDeleted={handleExpenseDeleted}
              onExpenseEdit={handleEditExpense}
              viewType="daily"
            />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <MonthlyView expenses={expenses} />
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <ExpenseSummary expenses={expenses} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <BudgetTracker
              expenses={expenses}
              budgets={budgets}
              categories={categories}
              onBudgetUpdated={handleBudgetUpdated}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExportData expenses={expenses} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showAddForm && (
          <AddExpenseForm
            onClose={() => setShowAddForm(false)}
            onExpenseAdded={handleExpenseAdded}
            categories={categories}
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
          />
        )}

        {showSettings && (
          <CategoryManager
            categories={categories}
            onClose={() => setShowSettings(false)}
            onCategoriesUpdated={handleCategoriesUpdated}
          />
        )}
      </div>
    </div>
  )
}

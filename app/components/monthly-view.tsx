"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Expense } from "../page"

interface MonthlyViewProps {
  expenses: Expense[]
  selectedMonth: number
  selectedYear: number
}

export function MonthlyView({ expenses, selectedMonth, selectedYear }: MonthlyViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDateExpenses, setSelectedDateExpenses] = useState<Expense[]>([])
  
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    expenses.forEach((expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    })
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{monthlyTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{categoryTotals[0]?.category || "N/A"}</div>
            <p className="text-xs text-muted-foreground">₹{categoryTotals[0]?.amount.toFixed(2) || "0.00"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>
            Category Breakdown for {months[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTotals.length > 0 ? (
            <div className="space-y-3">
              {categoryTotals.map((item) => (
                <div key={item.category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{item.category}</span>
                  <div className="text-right">
                    <div className="font-semibold">₹{item.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{((item.amount / monthlyTotal) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No expenses recorded for this month.</p>
          )}
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(
                expenses.reduce((groups, expense) => {
                  const date = expense.date;
                  if (!groups[date]) {
                    groups[date] = { total: 0, transactions: 0 };
                  }
                  groups[date].total += expense.amount;
                  groups[date].transactions += 1;
                  return groups;
                }, {} as Record<string, { total: number; transactions: number }>)
              )
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, { total, transactions }]) => (
                  <div 
                    key={date} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      const dayExpenses = expenses.filter(expense => expense.date === date);
                      setSelectedDateExpenses(dayExpenses);
                      setSelectedDate(date);
                    }}
                  >
                    <div className="font-medium mb-2 sm:mb-0">
                      {new Date(date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      }).replace(/\//g, '-')}
                    </div>
                    <div className="text-right w-full sm:w-auto">
                      <div className="font-semibold text-blue-600">₹{total.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {transactions} transaction{transactions !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No expenses recorded for this month.</p>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions for {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              }).replace(/\//g, '-') : ""}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {selectedDateExpenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-600">{expense.category}</div>
                  <div className="text-sm text-gray-700">{expense.description || <span className="italic text-gray-400">No description</span>}</div>
                  <div className="text-xs text-gray-500">
                    Added: {new Date(expense.created_at).toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }).replace(/\//g, '-')}
                  </div>
                </div>
                <div className="font-semibold text-lg">₹{expense.amount.toFixed(2)}</div>
              </div>
            ))}
            {selectedDateExpenses.length === 0 && (
              <div className="text-center text-gray-500 py-8">No transactions found for this date.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

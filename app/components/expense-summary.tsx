"use client"

import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "../page"

interface ExpenseSummaryProps {
  expenses: Expense[]
  selectedMonth?: number
  selectedYear?: number
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
]

export function ExpenseSummary({ expenses, selectedMonth, selectedYear }: ExpenseSummaryProps) {
  const [timeRange, setTimeRange] = useState("thisMonth")

  const filteredExpenses = useMemo(() => {
    // If selectedMonth and selectedYear are provided, filter by those first
    let baseExpenses = expenses;
    
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      baseExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
      });
      
      // If we're filtering by selected month/year, we don't need additional filtering
      if (timeRange === "thisMonth") {
        return baseExpenses;
      }
    }
    
    const now = new Date()

    switch (timeRange) {
      case "thisWeek":
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        return baseExpenses.filter((expense) => new Date(expense.date) >= weekStart)

      case "thisMonth":
        if (selectedMonth !== undefined && selectedYear !== undefined) {
          return baseExpenses;
        }
        return baseExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
        })

      case "lastMonth":
        if (selectedMonth !== undefined && selectedYear !== undefined) {
          const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
          const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
          return expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
          });
        } else {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
          return baseExpenses.filter((expense) => {
            const expenseDate = new Date(expense.date)
            return expenseDate >= lastMonth && expenseDate <= lastMonthEnd
          });
        }

      case "last3Months":
        if (selectedMonth !== undefined && selectedYear !== undefined) {
          let threeMonthsAgo = new Date(selectedYear, selectedMonth - 2, 1);
          if (selectedMonth < 3) {
            threeMonthsAgo = new Date(selectedYear - 1, 12 + (selectedMonth - 2), 1);
          }
          return expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= threeMonthsAgo;
          });
        } else {
          const threeMonthsAgo = new Date(now)
          threeMonthsAgo.setMonth(now.getMonth() - 3)
          return baseExpenses.filter((expense) => new Date(expense.date) >= threeMonthsAgo)
        }

      default:
        return baseExpenses
    }
  }, [expenses, timeRange])

  const categoryData = useMemo(() => {
    try {
      // If no expenses, return empty array
      if (!filteredExpenses || filteredExpenses.length === 0) {
        return [];
      }
      
      // Group expenses by category
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          // Ensure category is never undefined/empty
          const category = expense.category || "Uncategorized";
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += expense.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      // Convert to array and sort by amount (highest first)
      return Object.entries(categoryTotals)
        .map(([category, amount]) => ({ 
          category, 
          amount,
          name: category, // Add name key for recharts compatibility
          value: amount, // Add value key as alternative for recharts
        }))
        .sort((a, b) => b.amount - a.amount);
    } catch (error) {
      console.error("Error processing category data:", error);
      return []; // Return empty array on error
    }
  }, [filteredExpenses]);

  const totalAmount = useMemo(() => {
    try {
      return filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    } catch (error) {
      console.error("Error calculating total amount:", error);
      return 0;
    }
  }, [filteredExpenses]);
  
  const topCategory = categoryData && categoryData.length > 0 ? categoryData[0] : null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expense Summary</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="last3Months">Last 3 Months</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-2xl">₹{totalAmount.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Category</CardDescription>
            <CardTitle className="text-lg">{topCategory?.category || "N/A"}</CardTitle>
            <CardDescription>₹{topCategory?.amount.toFixed(2) || "0.00"}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Category Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, "Amount"]} 
                    labelFormatter={(name) => `Category: ${name}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categoryData.map((item, index) => (
              <div key={item.category} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{item.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{((item.amount / totalAmount) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

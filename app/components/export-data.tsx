"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Expense } from "../page"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface ExportDataProps {
  expenses: Expense[]
}

export function ExportData({ expenses }: ExportDataProps) {
  const [exportRange, setExportRange] = useState("all")
  const [isExporting, setIsExporting] = useState(false)

  const getFilteredExpenses = () => {
    const now = new Date()

    switch (exportRange) {
      case "thisMonth":
        return expenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
        })
      case "lastMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return expenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate >= lastMonth && expenseDate <= lastMonthEnd
        })
      case "last3Months":
        const threeMonthsAgo = new Date(now)
        threeMonthsAgo.setMonth(now.getMonth() - 3)
        return expenses.filter((expense) => new Date(expense.date) >= threeMonthsAgo)
      case "thisYear":
        return expenses.filter((expense) => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getFullYear() === now.getFullYear()
        })
      default:
        return expenses
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const filteredExpenses = getFilteredExpenses()
      if (filteredExpenses.length === 0) {
        alert("No expenses to export for the selected range.")
        return
      }

      const doc = new jsPDF()
      let yPosition = 20

      // Header
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("Expense Report", 20, yPosition)

      yPosition += 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition)

      const dateRange =
        exportRange === "all"
          ? "All Time"
          : exportRange === "thisMonth"
            ? "This Month"
            : exportRange === "lastMonth"
              ? "Last Month"
              : exportRange === "last3Months"
                ? "Last 3 Months"
                : "This Year"

      doc.text(`Period: ${dateRange}`, 20, yPosition + 7)
      yPosition += 25

      // Summary
      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const avgPerTransaction = total / filteredExpenses.length

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Summary", 20, yPosition)
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(`Total Expenses: Rs.${total.toFixed(2)}`, 20, yPosition)
      doc.text(`Total Transactions: ${filteredExpenses.length}`, 20, yPosition + 7)
      doc.text(`Average per Transaction: Rs.${avgPerTransaction.toFixed(2)}`, 20, yPosition + 14)
      yPosition += 30

      // Category Analysis
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Category Breakdown", 20, yPosition)
      yPosition += 10

      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)

      const categoryTableData = sortedCategories.map(([category, amount]) => [
        category,
        `Rs.${amount.toFixed(2)}`,
        `${((amount / total) * 100).toFixed(1)}%`,
      ])

      autoTable(doc, {
        head: [["Category", "Amount", "Percentage"]],
        body: categoryTableData,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "center" },
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20

      // Recent Transactions
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Recent Transactions", 20, yPosition)
      yPosition += 10

      const recentExpenses = [...filteredExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)

      const transactionTableData = recentExpenses.map((expense) => [
        expense.date,
        expense.category,
        `Rs.${expense.amount.toFixed(2)}`,
        expense.description || "-",
      ])

      autoTable(doc, {
        head: [["Date", "Category", "Amount", "Description"]],
        body: transactionTableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { halign: "right", cellWidth: 30 },
          3: { cellWidth: 90 },
        },
      })

      const fileName = `expense-report-${exportRange}-${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("PDF export error:", error)
      alert("Error exporting PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    setIsExporting(true)
    try {
      const filteredExpenses = getFilteredExpenses()
      if (filteredExpenses.length === 0) {
        alert("No expenses to export for the selected range.")
        return
      }

      const wb = XLSX.utils.book_new()

      // Summary Sheet
      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const summaryData = [
        ["Expense Report Summary"],
        ["Generated On", new Date().toLocaleDateString()],
        ["Period", exportRange],
        [""],
        ["Total Expenses", total],
        ["Total Transactions", filteredExpenses.length],
        ["Average per Transaction", total / filteredExpenses.length],
      ]

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

      // Expenses Sheet
      const expenseData = filteredExpenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense) => ({
          Date: expense.date,
          Category: expense.category,
          Amount: expense.amount,
          Description: expense.description || "",
        }))

      const expenseWs = XLSX.utils.json_to_sheet(expenseData)
      XLSX.utils.book_append_sheet(wb, expenseWs, "Expenses")

      // Category Analysis Sheet
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      const categoryAnalysis = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          Category: category,
          Amount: amount,
          Percentage: `${((amount / total) * 100).toFixed(2)}%`,
          "Transaction Count": filteredExpenses.filter((e) => e.category === category).length,
        }))

      const categoryWs = XLSX.utils.json_to_sheet(categoryAnalysis)
      XLSX.utils.book_append_sheet(wb, categoryWs, "Categories")

      XLSX.writeFile(wb, `expense-analysis-${exportRange}-${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Excel export error:", error)
      alert("Error exporting Excel file. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Range</label>
            <Select value={exportRange} onValueChange={setExportRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="last3Months">Last 3 Months</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 w-full sm:flex-1"
            >
              <FileText className="w-4 h-4" />
              {isExporting ? "Creating PDF..." : "Export PDF"}
            </Button>

            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:flex-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? "Creating Excel..." : "Export Excel"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">PDF Report</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Summary with totals</li>
                <li>• Category breakdown</li>
                <li>• Recent transactions</li>
                <li>• Clean professional format</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Excel Analysis</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Multiple sheets</li>
                <li>• Category analysis</li>
                <li>• Detailed transactions</li>
                <li>• Ready for calculations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

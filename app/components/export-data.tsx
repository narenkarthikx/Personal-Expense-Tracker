"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileImage } from "lucide-react"
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

      // Title
      doc.setFontSize(20)
      doc.text("Expense Report", 20, 20)

      // Summary
      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      doc.setFontSize(12)
      doc.text(`Total Expenses: ₹${total.toFixed(2)}`, 20, 35)
      doc.text(`Number of Transactions: ${filteredExpenses.length}`, 20, 45)
      doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 20, 55)

      // Table data
      const tableData = filteredExpenses.map((expense) => [
        expense.date,
        expense.category,
        `₹${expense.amount.toFixed(2)}`,
        expense.description || "-",
      ])

      autoTable(doc, {
        head: [["Date", "Category", "Amount", "Description"]],
        body: tableData,
        startY: 65,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      // Category summary
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      const categorySummary = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => [category, `₹${amount.toFixed(2)}`])

      if (categorySummary.length > 0) {
        autoTable(doc, {
          head: [["Category", "Total Amount"]],
          body: categorySummary,
          startY: (doc as any).lastAutoTable.finalY + 20,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [34, 197, 94] },
        })
      }

      doc.save(`expense-report-${exportRange}-${new Date().toISOString().split("T")[0]}.pdf`)
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

      // Prepare data for Excel
      const excelData = filteredExpenses.map((expense) => ({
        Date: expense.date,
        Category: expense.category,
        Amount: expense.amount,
        Description: expense.description || "",
        "Created At": new Date(expense.created_at).toLocaleString(),
      }))

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Main expenses sheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      XLSX.utils.book_append_sheet(wb, ws, "Expenses")

      // Category summary sheet
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      const categorySummary = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({ Category: category, Total: amount }))

      const summaryWs = XLSX.utils.json_to_sheet(categorySummary)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Category Summary")

      // Save file
      XLSX.writeFile(wb, `expense-report-${exportRange}-${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Excel export error:", error)
      alert("Error exporting Excel file. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const exportToCSV = () => {
    setIsExporting(true)
    try {
      const filteredExpenses = getFilteredExpenses()
      if (filteredExpenses.length === 0) {
        alert("No expenses to export for the selected range.")
        return
      }

      const headers = ["Date", "Category", "Amount", "Description", "Created At"]
      const csvContent = [
        headers.join(","),
        ...filteredExpenses.map((expense) =>
          [
            expense.date,
            `"${expense.category}"`,
            expense.amount,
            `"${expense.description || ""}"`,
            `"${new Date(expense.created_at).toLocaleString()}"`,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `expenses-${exportRange}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("CSV export error:", error)
      alert("Error exporting CSV. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />📊 Export & Reports
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
              <FileImage className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>

            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:flex-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export Excel"}
            </Button>

            <Button
              onClick={exportToCSV}
              disabled={isExporting}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-transparent w-full sm:flex-1"
            >
              <FileText className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Export Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • <strong>PDF:</strong> Professional report with summaries and charts
              </li>
              <li>
                • <strong>Excel:</strong> Detailed spreadsheet with multiple sheets
              </li>
              <li>
                • <strong>CSV:</strong> Simple format for other applications
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

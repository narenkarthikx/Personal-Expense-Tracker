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
      let yPosition = 20

      // Helper function to add page breaks
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > 280) {
          doc.addPage()
          yPosition = 20
        }
      }

      // ===== HEADER SECTION =====
      doc.setFillColor(37, 99, 235) // Blue background
      doc.rect(0, 0, 210, 40, "F")

      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("💰 EXPENSE REPORT", 20, 25)

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        20,
        35,
      )

      yPosition = 50
      doc.setTextColor(0, 0, 0) // Reset to black

      // ===== EXECUTIVE SUMMARY =====
      doc.setFillColor(248, 250, 252) // Light gray background
      doc.rect(10, yPosition, 190, 35, "F")
      doc.setDrawColor(203, 213, 225)
      doc.rect(10, yPosition, 190, 35, "S")

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("📊 EXECUTIVE SUMMARY", 15, yPosition + 10)

      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const avgPerTransaction = total / filteredExpenses.length
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

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(51, 65, 85)
      doc.text(`Period: ${dateRange}`, 15, yPosition + 20)
      doc.text(`Total Expenses: ₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 15, yPosition + 27)
      doc.text(`Total Transactions: ${filteredExpenses.length}`, 110, yPosition + 20)
      doc.text(
        `Average per Transaction: ₹${avgPerTransaction.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        110,
        yPosition + 27,
      )

      yPosition += 45

      // ===== CATEGORY ANALYSIS =====
      checkPageBreak(80)

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("📈 CATEGORY BREAKDOWN", 15, yPosition)
      yPosition += 10

      // Calculate category totals and percentages
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Top 10 categories

      // Category summary table
      const categoryTableData = sortedCategories.map(([category, amount], index) => [
        `${index + 1}.`,
        category,
        `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `${((amount / total) * 100).toFixed(1)}%`,
        "█".repeat(Math.ceil((amount / sortedCategories[0][1]) * 20)), // Visual bar
      ])

      autoTable(doc, {
        head: [["#", "Category", "Amount", "% of Total", "Visual"]],
        body: categoryTableData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          1: { cellWidth: 60 },
          2: { halign: "right", cellWidth: 40 },
          3: { halign: "center", cellWidth: 25 },
          4: { halign: "left", cellWidth: 50, textColor: [34, 197, 94] },
        },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // ===== MONTHLY TREND (if applicable) =====
      if (filteredExpenses.length > 0) {
        checkPageBreak(60)

        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("📅 SPENDING PATTERN", 15, yPosition)
        yPosition += 10

        // Group by month
        const monthlyData = filteredExpenses.reduce(
          (acc, expense) => {
            const monthKey = new Date(expense.date).toLocaleDateString("en-IN", { year: "numeric", month: "short" })
            acc[monthKey] = (acc[monthKey] || 0) + expense.amount
            return acc
          },
          {} as Record<string, number>,
        )

        const monthlyTableData = Object.entries(monthlyData)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([month, amount]) => [
            month,
            `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            "█".repeat(Math.ceil((amount / Math.max(...Object.values(monthlyData))) * 25)),
          ])

        autoTable(doc, {
          head: [["Month", "Total Spent", "Trend"]],
          body: monthlyTableData,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: {
            fillColor: [147, 51, 234],
            textColor: [255, 255, 255],
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { halign: "right", cellWidth: 50 },
            2: { textColor: [147, 51, 234], cellWidth: 100 },
          },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // ===== DETAILED TRANSACTIONS =====
      checkPageBreak(40)

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("📋 DETAILED TRANSACTIONS", 15, yPosition)
      yPosition += 5

      // Sort expenses by date (newest first)
      const sortedExpenses = [...filteredExpenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )

      const transactionTableData = sortedExpenses.map((expense) => [
        new Date(expense.date).toLocaleDateString("en-IN"),
        expense.category,
        `₹${expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        expense.description || "-",
      ])

      autoTable(doc, {
        head: [["Date", "Category", "Amount", "Description"]],
        body: transactionTableData,
        startY: yPosition + 10,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242],
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { halign: "right", cellWidth: 35 },
          3: { cellWidth: 85 },
        },
      })

      // ===== FOOTER WITH INSIGHTS =====
      const finalY = (doc as any).lastAutoTable.finalY
      if (finalY + 40 > 280) {
        doc.addPage()
        yPosition = 20
      } else {
        yPosition = finalY + 20
      }

      // Insights box
      doc.setFillColor(254, 249, 195) // Light yellow
      doc.rect(10, yPosition, 190, 40, "F")
      doc.setDrawColor(245, 158, 11)
      doc.rect(10, yPosition, 190, 40, "S")

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(146, 64, 14)
      doc.text("💡 KEY INSIGHTS", 15, yPosition + 10)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(120, 53, 15)

      const topCategory = sortedCategories[0]
      const insights = [
        `• Highest spending category: ${topCategory[0]} (₹${topCategory[1].toLocaleString("en-IN")})`,
        `• Daily average: ₹${(total / Math.max(1, Math.ceil((new Date(sortedExpenses[0].date).getTime() - new Date(sortedExpenses[sortedExpenses.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        `• Most active spending day: ${new Date(sortedExpenses[0].date).toLocaleDateString("en-IN", { weekday: "long" })}`,
        `• Categories tracked: ${Object.keys(categoryTotals).length}`,
      ]

      insights.forEach((insight, index) => {
        doc.text(insight, 15, yPosition + 20 + index * 5)
      })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128)
      doc.text("Generated by Expense Tracker Pro | Keep tracking, keep saving! 💰", 15, 290)
      doc.text(`Page ${doc.getNumberOfPages()}`, 180, 290)

      // Save the PDF
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

      // Create workbook
      const wb = XLSX.utils.book_new()

      // ===== SUMMARY SHEET =====
      const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const avgPerTransaction = total / filteredExpenses.length

      const summaryData = [
        ["EXPENSE REPORT SUMMARY", ""],
        ["Generated On", new Date().toLocaleDateString("en-IN")],
        ["Period", exportRange === "all" ? "All Time" : exportRange],
        ["", ""],
        ["FINANCIAL OVERVIEW", ""],
        ["Total Expenses", `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
        ["Total Transactions", filteredExpenses.length],
        ["Average per Transaction", `₹${avgPerTransaction.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
        ["", ""],
        ["TOP CATEGORIES", "AMOUNT"],
      ]

      // Add top categories
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount
          return acc
        },
        {} as Record<string, number>,
      )

      Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([category, amount]) => {
          summaryData.push([category, `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`])
        })

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")

      // ===== DETAILED EXPENSES SHEET =====
      const expenseData = filteredExpenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((expense) => ({
          Date: expense.date,
          Category: expense.category,
          Amount: expense.amount,
          Description: expense.description || "",
          "Day of Week": new Date(expense.date).toLocaleDateString("en-IN", { weekday: "long" }),
          Month: new Date(expense.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
          "Created At": new Date(expense.created_at).toLocaleString("en-IN"),
        }))

      const expenseWs = XLSX.utils.json_to_sheet(expenseData)
      XLSX.utils.book_append_sheet(wb, expenseWs, "Detailed Expenses")

      // ===== CATEGORY ANALYSIS SHEET =====
      const categoryAnalysis = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          Category: category,
          "Total Amount": amount,
          Percentage: `${((amount / total) * 100).toFixed(2)}%`,
          "Transaction Count": filteredExpenses.filter((e) => e.category === category).length,
          "Average per Transaction": amount / filteredExpenses.filter((e) => e.category === category).length,
        }))

      const categoryWs = XLSX.utils.json_to_sheet(categoryAnalysis)
      XLSX.utils.book_append_sheet(wb, categoryWs, "Category Analysis")

      // ===== MONTHLY BREAKDOWN SHEET =====
      const monthlyData = filteredExpenses.reduce(
        (acc, expense) => {
          const monthKey = new Date(expense.date).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
          if (!acc[monthKey]) {
            acc[monthKey] = { total: 0, count: 0 }
          }
          acc[monthKey].total += expense.amount
          acc[monthKey].count += 1
          return acc
        },
        {} as Record<string, { total: number; count: number }>,
      )

      const monthlyAnalysis = Object.entries(monthlyData)
        .map(([month, data]) => ({
          Month: month,
          "Total Spent": data.total,
          "Transaction Count": data.count,
          "Average per Transaction": data.total / data.count,
          "Daily Average": data.total / 30, // Approximate
        }))
        .sort((a, b) => new Date(a.Month).getTime() - new Date(b.Month).getTime())

      const monthlyWs = XLSX.utils.json_to_sheet(monthlyAnalysis)
      XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Breakdown")

      // Save file
      XLSX.writeFile(wb, `expense-analysis-${exportRange}-${new Date().toISOString().split("T")[0]}.xlsx`)
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

      const headers = ["Date", "Category", "Amount", "Description", "Day of Week", "Month", "Created At"]

      const csvContent = [
        headers.join(","),
        ...filteredExpenses
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((expense) =>
            [
              expense.date,
              `"${expense.category}"`,
              expense.amount,
              `"${expense.description || ""}"`,
              `"${new Date(expense.date).toLocaleDateString("en-IN", { weekday: "long" })}"`,
              `"${new Date(expense.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}"`,
              `"${new Date(expense.created_at).toLocaleString("en-IN")}"`,
            ].join(","),
          ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `expenses-detailed-${exportRange}-${new Date().toISOString().split("T")[0]}.csv`)
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
            <Download className="w-5 h-5" />📊 Professional Export & Reports
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
              {isExporting ? "Creating PDF..." : "📄 Professional PDF"}
            </Button>

            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:flex-1"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? "Creating Excel..." : "📊 Advanced Excel"}
            </Button>

            <Button
              onClick={exportToCSV}
              disabled={isExporting}
              variant="outline"
              className="flex items-center justify-center gap-2 bg-transparent w-full sm:flex-1"
            >
              <FileText className="w-4 h-4" />
              {isExporting ? "Creating CSV..." : "📋 Detailed CSV"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">📄 Professional PDF</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Executive summary with key metrics</li>
                <li>• Visual category breakdown with charts</li>
                <li>• Monthly spending trends</li>
                <li>• Detailed transaction listing</li>
                <li>• Smart insights & recommendations</li>
                <li>• Professional formatting</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">📊 Advanced Excel</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Multiple analysis sheets</li>
                <li>• Summary dashboard</li>
                <li>• Category analysis with percentages</li>
                <li>• Monthly breakdown</li>
                <li>• Ready for pivot tables</li>
                <li>• Formatted for calculations</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Detailed CSV</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Enhanced with day of week</li>
                <li>• Month and year columns</li>
                <li>• Sorted by date</li>
                <li>• Import to any tool</li>
                <li>• Perfect for analysis</li>
                <li>• Lightweight format</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "./context/auth-context"
import { ConfigProvider } from "./context/config-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mexo - Expense Tracker",
  description: "Track your daily expenses with ease. A simple and effective expense management app."
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ConfigProvider disableStaticRendering={true}>
            <AuthProvider>
              <main className="min-h-screen max-w-screen overflow-x-hidden">
                {children}
              </main>
            </AuthProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

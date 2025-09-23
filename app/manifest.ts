import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mexo - My Expenses Optimized",
    short_name: "Mexo",
    description:
      "Track expenses, set budgets, and analyze your spending patterns - all in one app.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/placeholder-logo.png",
        sizes: "192x192",
        type: "image/png"
      }
    ]
  }
}

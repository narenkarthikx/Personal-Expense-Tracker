/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Handle missing environment variables gracefully
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // Next.js 15 configurations
  experimental: {
    // Newer configurations for stability
    serverMinification: true,
    serverActions: {
      allowedOrigins: ['localhost:3000', 'expense-tracker-pwa.vercel.app'],
    },
  },
  // PWA configuration
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}

export default nextConfig

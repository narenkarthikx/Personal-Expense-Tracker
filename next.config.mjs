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
      allowedOrigins: ['localhost:3000', 'expense-tracker-pwa.netlify.app'],
    },
    // Disable Edge runtime as it's not compatible with some Supabase dependencies
    runtime: 'nodejs',
  },
  // Basic production settings
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Output standalone for better containerization
  output: 'standalone',
  // Simple headers for caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ];
  },
}

export default nextConfig

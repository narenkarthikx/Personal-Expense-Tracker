# Mexo - My Expenses Optimized

A progressive web app (PWA) for tracking personal expenses, managing budgets, and analyzing spending patterns.

## Features

- 📱 Fully responsive design
- 📊 Expense analytics and visualization
- 💰 Budget tracking by category
- 🗓️ Daily and monthly expense views
- 📤 Export data in various formats
- 🌐 Works offline with PWA capabilities
- 🔐 User authentication with Supabase

## Setup for Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. Run the development server:
   ```bash
   pnpm dev
   ```

## Deployment on Vercel

This project is configured for seamless deployment on Vercel.

### Environment Variables

Make sure to set these environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Automatic Deployments

The project is configured to automatically deploy when changes are pushed to the main branch.

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- PWA capabilities

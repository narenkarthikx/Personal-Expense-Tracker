# Mexo - My Expenses Optimized

A progressive web application (PWA) for tracking personal expenses, managing budgets, and analyzing spending patterns.

## Features

- **User Authentication**: Secure login and signup with email/password
- **Expense Tracking**: Add, edit, and delete expenses with categories
- **Budget Management**: Set and track monthly budgets by category
- **Spending Analytics**: Visualize spending patterns with charts and summaries
- **Month Selection**: Filter data by month and year
- **Data Export**: Export expense data in various formats
- **Offline Support**: Works offline as a PWA
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication)
- **Data Visualization**: Recharts
- **PWA**: Next PWA

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm package manager
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/narenkarthikx/Personal-Expense-Tracker.git
   cd expense-tracker-pwa
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database
   - Create a new project in Supabase
   - Run the SQL scripts in the `scripts` folder to set up tables and functions:
     - `create-all-tables.sql`
     - `create-users-table.sql`
     - `create-expenses-table.sql`
     - `delete-user-data.sql`

5. Start the development server
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

1. Build the application
   ```bash
   pnpm build
   ```

2. Deploy to your preferred hosting provider
   - Vercel, Netlify, etc.
   - Make sure to set up the environment variables

## Database Schema

The application uses the following database tables:

- **users** - User authentication and profiles
- **expenses** - Individual expense transactions
- **budgets** - Monthly budget targets by category
- **categories** - User-defined expense categories

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/)

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          amount: number
          category: string
          description: string | null
          date: string
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          amount: number
          category: string
          description?: string | null
          date?: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          amount?: number
          category?: string
          description?: string | null
          date?: string
          created_at?: string
          user_id?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          category: string
          amount: number
          month: string
          year: number
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          category: string
          amount: number
          month: string
          year: number
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          category?: string
          amount?: number
          month?: string
          year?: number
          created_at?: string
          user_id?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          user_id?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type UserProfile = {
  id: string
  email: string | null
  name: string | null
  user_metadata?: Record<string, any>
}

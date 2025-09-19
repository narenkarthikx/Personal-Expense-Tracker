export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Auth types
export interface UserProfile {
  id: string
  email: string | null
  name?: string | null
  user_metadata?: {
    name?: string | null
    [key: string]: any
  }
}

export interface Database {
  public: {
    Tables: {
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
      expenses: {
        Row: {
          id: string
          amount: number
          category: string
          description: string
          date: string
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          amount: number
          category: string
          description?: string
          date?: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          amount?: number
          category?: string
          description?: string
          date?: string
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
    },
    Functions: {
      delete_user_data: {
        Args: {
          user_id_input: string
        }
        Returns: undefined
      }
    },
    Views: {
      [_ in never]: never
    },
    Enums: {
      [_ in never]: never
    }
  }
}

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables')
}

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Database types
export type Database = {
  public: {
    Tables: {
      cafes: {
        Row: {
          id: string // UUID
          name: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cafes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cafes']['Insert']>
      }
      reviews: {
        Row: {
          id: string // UUID
          cafe_id: string // UUID
          user_id: string // UUID
          content: string
          rating: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      users: { // renamed from profiles
        Row: {
          id: string // UUID
          username: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
    }
  }
}

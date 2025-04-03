import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables')
}

// Initialize Supabase client - so our app can interact with the database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Re-export the Database type - allows our app to import both the client and types from a single location
export type { Database }
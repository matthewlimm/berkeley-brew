import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or Service Role Key in environment variables')
}

// Create client with service role key to bypass RLS policies
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Export as serviceRoleClient for clarity in backend code
export const serviceRoleClient = supabase

// Create a client with anon key for operations that should respect RLS
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)

// Re-export the Database type - allows our app to import both the client and types from a single location
export type { Database }

export interface User {
  id: string;
  username: string;
  full_name: string; // Add this line
  created_at: string;
  updated_at: string; // Add this line
}

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Regular client with anonymous key (subject to RLS policies)
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Service role client that bypasses RLS policies
// Note: In production, you should store the service role key securely
export const serviceRoleClient = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : supabase // Fallback to regular client if no service role key is available

export type { Database }

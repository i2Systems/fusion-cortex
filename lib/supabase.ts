/**
 * Supabase Client
 * 
 * Client for Supabase Storage operations.
 * Uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
// For Supabase Storage, we need:
// - SUPABASE_URL: Your Supabase project URL (e.g., https://xxxxx.supabase.co)
// - SUPABASE_ANON_KEY: Your Supabase anon/public key
// - SUPABASE_SERVICE_KEY: Your Supabase service role key (for server-side operations)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or anon key not configured. Image uploads will use fallback storage.')
}

// Client for client-side operations (public bucket access)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Client for server-side operations (service role key for admin access)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Storage bucket names
export const STORAGE_BUCKETS = {
  SITE_IMAGES: 'site-images',
  LIBRARY_IMAGES: 'library-images',
} as const


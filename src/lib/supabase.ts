import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy Supabase client — initialized on first use (not at module load / build time)
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase environment variables are not configured')
    }
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

// Convenience alias (backwards-compat)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})

export type { SupabaseClient } from '@supabase/supabase-js'

// Database type definitions
export interface DbUser {
  id: string
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  followed_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbQuizSession {
  id: string
  line_user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface DbQuizAnswer {
  id: string
  session_id: string
  question_number: number
  score: number
  answered_at: string
}

export interface DbQuizResult {
  id: string
  session_id: string
  line_user_id: string
  total_score: number
  literacy_level: 'low' | 'medium' | 'high'
  completed_at: string
}

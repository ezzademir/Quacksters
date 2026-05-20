import { createClient } from '@supabase/supabase-js'

/**
 * GitHub Secrets / copy-paste often injects trailing newlines or wrapping quotes,
 * which makes the anon JWT invalid and every login fail with "invalid credentials".
 */
function readVitePublicEnv(value: string | undefined): string | undefined {
  if (value == null) return undefined
  const t = String(value).trim()
  if (t === '' || t === 'undefined' || t === 'null') return undefined
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim() || undefined
  }
  return t
}

const supabaseUrl = readVitePublicEnv(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = readVitePublicEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}

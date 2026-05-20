import { createClient } from '@supabase/supabase-js'

/**
 * If set, the deployed VITE_SUPABASE_URL and anon JWT are from different projects.
 * Login will always fail with "invalid credentials" until GitHub Secrets are fixed.
 */
export let authConfigurationMismatch: string | null = null

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

/** e.g. https://abc123.supabase.co -> abc123 */
function projectRefFromSupabaseUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    const m = /^([^.]+)\.supabase\.co$/i.exec(hostname)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

/** Legacy anon JWT payload includes `ref` (project id). */
function projectRefFromAnonJwt(jwt: string): string | null {
  const parts = jwt.split('.')
  if (parts.length < 2) return null
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (b64.length % 4)) % 4)
    const json =
      typeof atob === 'function'
        ? atob(b64 + pad)
        : null
    if (json == null) return null
    const payload = JSON.parse(json) as { ref?: string }
    return payload.ref ?? null
  } catch {
    return null
  }
}

function checkUrlAndKeySameProject(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return
  const fromUrl = projectRefFromSupabaseUrl(url)
  const fromJwt = projectRefFromAnonJwt(anonKey)
  if (!fromUrl || !fromJwt || fromUrl === fromJwt) return

  const msg = [
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are from different Supabase projects.',
    `URL project ref: "${fromUrl}", anon JWT ref: "${fromJwt}".`,
    'In GitHub → Settings → Secrets, set both from the same project (Dashboard → API).',
  ].join(' ')
  authConfigurationMismatch = msg
  console.error(`[auth] ${msg}`)
}

const supabaseUrl = readVitePublicEnv(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = readVitePublicEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (supabaseUrl && supabaseAnonKey) {
  checkUrlAndKeySameProject(supabaseUrl, supabaseAnonKey)
}

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

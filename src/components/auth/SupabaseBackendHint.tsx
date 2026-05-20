import { isSupabaseConfigured } from '../../lib/supabase'

function supabaseHostname(url: string): string | null {
  try {
    const host = new URL(url.trim()).hostname
    return host || null
  } catch {
    return null
  }
}

/**
 * Shows which Supabase project hostname this build uses. The URL is already
 * embedded in client JS and visible in DevTools → Network; this helps confirm
 * GitHub Secrets / local `.env` match the dashboard project.
 */
export function SupabaseBackendHint() {
  if (!isSupabaseConfigured) return null
  const raw = import.meta.env.VITE_SUPABASE_URL?.trim()
  if (!raw) return null

  const host = supabaseHostname(raw)
  if (!host) return null

  return (
    <p className="mt-3 text-center text-xs text-slate-500">
      Backend:{' '}
      <span className="break-all font-mono text-slate-600" title={raw}>
        {host}
      </span>
    </p>
  )
}

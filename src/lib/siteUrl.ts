/**
 * Absolute URL for the SPA document root (no path segment, no `#`), e.g. password-reset
 * `redirectTo` on GitHub Pages. Supabase appends `#access_token=...&type=recovery` itself.
 */
export function absoluteAppRootUrl(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const origin = window.location.origin
  const rawBase = import.meta.env.BASE_URL ?? '/'

  if (rawBase === './' || rawBase === '') {
    return `${origin}/`
  }

  const basePath = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  return `${origin}${basePath}/`
}

/**
 * Absolute URL for an in-app path (path-based; not used for HashRouter `#` routes in email links).
 * Honors Vite `base` / `import.meta.env.BASE_URL` (e.g. GitHub Pages project sites).
 */
export function absoluteAppUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path
  }

  const origin = window.location.origin
  const rawBase = import.meta.env.BASE_URL ?? '/'
  const rel = path.startsWith('/') ? path : `/${path}`

  if (rawBase === './' || rawBase === '') {
    return `${origin}${rel}`
  }

  const basePath = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  return `${origin}${basePath}${rel}`
}

/**
 * Absolute URL for the SPA (password-reset redirects, etc.).
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

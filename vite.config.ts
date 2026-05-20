import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Capacitor/local default; GitHub Pages workflow sets `VITE_BASE_PATH=/RepoName/`. */
function viteBase(): string {
  const raw = process.env.VITE_BASE_PATH
  if (raw == null || raw === '') return './'
  const trimmed = raw.trim()
  if (trimmed === './') return './'
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: viteBase(),
})

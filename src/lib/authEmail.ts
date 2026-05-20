/** Normalize email for Supabase Auth (trim + lowercase). */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase()
}

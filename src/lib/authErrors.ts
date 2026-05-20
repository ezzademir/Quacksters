import type { AuthError } from '@supabase/supabase-js'

/** User-facing messages for common Supabase Auth failures. */
export function formatAuthErrorMessage(error: AuthError): string {
  const msg = (error.message ?? '').trim()
  const code = error.code ?? ''

  if (
    code === 'invalid_credentials' ||
    msg.toLowerCase().includes('invalid login credentials')
  ) {
    return 'That email or password does not match our records. Try again or use Forgot password below.'
  }

  if (
    code === 'email_not_confirmed' ||
    msg.toLowerCase().includes('email not confirmed')
  ) {
    return 'Confirm your email first — open the verification link Supabase sent you, then sign in.'
  }

  if (msg.toLowerCase().includes('too many requests')) {
    return 'Too many attempts. Wait a minute and try again.'
  }

  return msg || 'Something went wrong. Try again.'
}

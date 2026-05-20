import { useState } from 'react'
import { Link } from 'react-router-dom'
import { normalizeAuthEmail } from '../../lib/authEmail'
import { formatAuthErrorMessage } from '../../lib/authErrors'
import { absoluteAppUrl } from '../../lib/siteUrl'
import { requireSupabase } from '../../lib/supabase'
import { SupabaseBackendHint } from './SupabaseBackendHint'

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const normalized = normalizeAuthEmail(email)
    if (!normalized) {
      setError('Enter your email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const client = requireSupabase()
      const redirectTo = absoluteAppUrl('/recover-password')
      const { error: resetError } = await client.auth.resetPasswordForEmail(
        normalized,
        { redirectTo },
      )
      if (resetError) {
        setError(formatAuthErrorMessage(resetError))
        setIsSubmitting(false)
        return
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-900/80">
            Quackteow Group
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Forgot password</h1>
          <p className="mt-2 text-brand-900/70">
            We will email you a link to choose a new password.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl bg-white p-5 shadow-xl">
          {sent ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              If an account exists for that email, we sent reset instructions. Check your inbox and
              spam folder.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-brand-700">
              Back to sign in
            </Link>
          </p>
          <SupabaseBackendHint />
        </div>
      </div>
    </div>
  )
}

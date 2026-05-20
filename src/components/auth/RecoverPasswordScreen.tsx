import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatAuthErrorMessage } from '../../lib/authErrors'
import { requireSupabase } from '../../lib/supabase'
import { SupabaseBackendHint } from './SupabaseBackendHint'

export function RecoverPasswordScreen() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [allowReset, setAllowReset] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const client = requireSupabase()
    let canceled = false

    void client.auth.getSession().then(({ data }) => {
      if (canceled) return
      if (data.session) setAllowReset(true)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAllowReset(true)
    })

    const timer = window.setTimeout(() => setTimedOut(true), 15_000)

    return () => {
      canceled = true
      subscription.unsubscribe()
      window.clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsSaving(true)
    try {
      const client = requireSupabase()
      const { error: authError } = await client.auth.updateUser({ password })
      if (authError) {
        setError(formatAuthErrorMessage(authError))
        setIsSaving(false)
        return
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
      setIsSaving(false)
    }
  }

  if (!allowReset && !timedOut) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-sm text-slate-600">Opening reset link…</p>
      </div>
    )
  }

  if (!allowReset && timedOut) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">Link invalid or expired</h1>
          <p className="mt-2 text-sm text-slate-600">
            Request a new reset link from the sign-in page.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Forgot password
          </Link>
          <p className="mt-4">
            <Link to="/login" className="text-sm font-semibold text-brand-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-900/80">
            Quackteow Group
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Choose a new password</h1>
          <p className="mt-2 text-brand-900/70">
            Enter a new password for your account, then continue to the app.
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl bg-white p-5 shadow-xl"
          onSubmit={(e) => void handleSubmit(e)}
        >
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              New password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Confirm password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save password'}
          </button>
          <p className="text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-brand-700">
              Back to sign in
            </Link>
          </p>
          <SupabaseBackendHint />
        </form>
      </div>
    </div>
  )
}

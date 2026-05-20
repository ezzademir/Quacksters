import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requireSupabase } from '../../lib/supabase'

export function PasswordResetScreen() {
  const { profile, session, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile && !profile.password_reset_required) {
      navigate(profile.access_role === 'hire' ? '/' : '/admin', { replace: true })
    }
  }, [navigate, profile])

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
    const client = requireSupabase()
    const { error: authError } = await client.auth.updateUser({ password })
    if (authError) {
      setError(authError.message)
      setIsSaving(false)
      return
    }

    if (session?.user.id) {
      const { error: rpcError } = await client.rpc('complete_password_change')
      if (rpcError) {
        setError(rpcError.message)
        setIsSaving(false)
        return
      }
    }

    await refreshProfile()
    setIsSaving(false)
    navigate(profile?.access_role === 'hire' ? '/' : '/admin', { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your account requires a password change before you can continue.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">New password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Confirm password</span>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Update password'}
          </button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Sign out instead
          </button>
        </form>
      </div>
    </div>
  )
}

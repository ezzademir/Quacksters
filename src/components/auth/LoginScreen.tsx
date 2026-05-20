import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function LoginScreen() {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const result = await signIn(email.trim(), password)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(result.redirectTo ?? '/')
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600">
          Auth requires Supabase. Copy <code>.env.example</code> to{' '}
          <code>.env</code> and add your project keys.
        </p>
        <Link to="/" className="mt-4 text-brand-700 underline">
          Continue in offline mode
        </Link>
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
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-2 text-brand-900/70">
            Access your onboarding companion or admin console.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl bg-white p-5 shadow-xl"
        >
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Password
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
            <LogIn className="h-5 w-5" />
          </button>

          <p className="text-center text-sm text-slate-600">
            New hire?{' '}
            <Link to="/register" className="font-semibold text-brand-700">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

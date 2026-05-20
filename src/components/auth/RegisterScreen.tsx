import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOutlets } from '../../context/OutletsContext'
import type { RoleFilter } from '../../types/onboarding'
import { SupabaseBackendHint } from './SupabaseBackendHint'

const jobRoles: { value: RoleFilter; label: string }[] = [
  { value: 'cook', label: 'Cook' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'supervisor', label: 'Supervisor' },
]

export function RegisterScreen() {
  const { signUp } = useAuth()
  const { outletNames } = useOutlets()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [requestedOutlet, setRequestedOutlet] = useState('')
  const [requestedJobRole, setRequestedJobRole] = useState<RoleFilter>('cook')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (outletNames.length && !requestedOutlet) {
      setRequestedOutlet(outletNames[0])
    }
  }, [outletNames, requestedOutlet])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      requestedOutlet,
      requestedJobRole,
    })

    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }

    navigate('/pending')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-900/80">
            Quackteow Group
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Register</h1>
          <p className="mt-2 text-brand-900/70">
            Create an account. HR will review and approve before you can start
            onboarding.
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
              Full name
            </span>
            <input
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Preferred outlet (optional)
            </span>
            <select
              value={requestedOutlet}
              onChange={(e) => setRequestedOutlet(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            >
              {outletNames.map((outlet) => (
                <option key={outlet} value={outlet}>
                  {outlet}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Preferred role (optional)
            </span>
            <select
              value={requestedJobRole}
              onChange={(e) =>
                setRequestedJobRole(e.target.value as RoleFilter)
              }
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            >
              {jobRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit for approval'}
            <UserPlus className="h-5 w-5" />
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700">
              Sign in
            </Link>
          </p>
          <SupabaseBackendHint />
        </form>
      </div>
    </div>
  )
}

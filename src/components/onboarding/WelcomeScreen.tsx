import { useState } from 'react'
import { ArrowRight, ChefHat, LogOut, Store, UserCircle2 } from 'lucide-react'
import { defaultUserProfile } from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'
import { useOutlets } from '../../context/OutletsContext'
import { useOnboarding } from '../../context/OnboardingContext'
import { hireProfileToUserProfile } from '../../types/onboarding'

import { getRoleProgramSubtitle, getRoleLabel } from '../../lib/onboardingPersonalization'

const jobRoleLabels: Record<string, string> = {
  cook: 'Cook',
  cashier: 'Cashier',
  supervisor: 'Supervisor',
}

const roleWelcomeCopy: Record<string, string> = {
  cook:
    'Your kitchen onboarding roadmap is ready. You will focus on portions, food safety, and plate speed.',
  cashier:
    'Your front-of-house roadmap is ready. You will focus on POS accuracy, customer service, and cash control.',
  supervisor:
    'Your supervisor track is ready. You will focus on outlet standards, team routines, and leadership moments.',
}

export function WelcomeScreen() {
  const { saveProfile, confirmHireProfile, isOfflineMode, awaitingHireAssignment } =
    useOnboarding()
  const { hireProfile, profile: authProfile, session, signOut } = useAuth()

  const isServerHire =
    !isOfflineMode && session && authProfile?.access_role === 'hire' && hireProfile

  if (awaitingHireAssignment) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-400 to-brand-600 px-4 text-center">
        <div className="max-w-md rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Almost ready</h1>
          <p className="mt-2 text-slate-600">
            Your account is approved. HR is finalising your outlet and role
            assignment. Check back soon.
          </p>
          {session && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isServerHire && authProfile) {
    const form = hireProfileToUserProfile(
      session.user.id,
      authProfile.full_name,
      hireProfile,
    )

    return (
      <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] text-slate-900">
        <div className="mx-auto w-full max-w-lg flex-1">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-900/80">
              Quackteow Group
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Welcome, {form.name.split(' ')[0]}
            </h1>
            <p className="mt-2 text-brand-900/70">
              {roleWelcomeCopy[form.role] ??
                'HR has assigned your onboarding profile. Confirm to get started.'}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-900/60">
              {getRoleLabel(form.role)} at {form.outlet} ·{' '}
              {getRoleProgramSubtitle(form.role)}
            </p>
          </div>

          <div className="space-y-4 rounded-3xl bg-white p-5 shadow-xl">
            <DetailRow icon={UserCircle2} label="Full name" value={form.name} />
            <DetailRow
              icon={ChefHat}
              label="Role"
              value={jobRoleLabels[form.role] ?? form.role}
            />
            <DetailRow icon={Store} label="Outlet" value={form.outlet} />
            <DetailRow label="Start date" value={form.startDate} />
            <DetailRow label="Buddy" value={form.buddy} />
            <DetailRow label="Supervisor" value={form.supervisor} />

            <button
              type="button"
              onClick={() => void confirmHireProfile()}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800"
            >
              Start your {jobRoleLabels[form.role]?.toLowerCase() ?? 'onboarding'} roadmap
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <OfflineWelcomeForm onSave={saveProfile} />
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof UserCircle2
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1 text-base font-medium text-slate-900">{value}</p>
    </div>
  )
}

function OfflineWelcomeForm({
  onSave,
}: {
  onSave: (profile: typeof defaultUserProfile) => Promise<void>
}) {
  const { outletNames } = useOutlets()
  const [form, setForm] = useState(defaultUserProfile)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = form.name.trim().length >= 2 && form.startDate

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    await onSave({
      ...form,
      name: form.name.trim(),
      buddy: form.buddy.trim() || 'Assigned on Day 1',
      supervisor: form.supervisor.trim() || 'Outlet Supervisor',
    })
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] text-slate-900">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-900/80">
            Quackteow Group
          </p>
          <h1 className="mt-2 text-3xl font-bold">Welcome to Quacksters</h1>
          <p className="mt-2 text-brand-900/70">
            Your 30 · 60 · 90 day onboarding companion. Set up your profile to
            get started.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl bg-white p-5 text-slate-900 shadow-xl"
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UserCircle2 className="h-4 w-4" />
              Full name
            </span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
              placeholder="Your name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ChefHat className="h-4 w-4" />
              Role
            </span>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as typeof form.role,
                })
              }
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            >
              <option value="cook">Cook</option>
              <option value="cashier">Cashier</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Store className="h-4 w-4" />
              Outlet
            </span>
            <select
              value={form.outlet}
              onChange={(e) => setForm({ ...form, outlet: e.target.value })}
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
              Start date
            </span>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Buddy (optional)
            </span>
            <input
              value={form.buddy}
              onChange={(e) => setForm({ ...form, buddy: e.target.value })}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
              placeholder="Assigned on Day 1"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Supervisor (optional)
            </span>
            <input
              value={form.supervisor}
              onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
              className="min-h-[48px] w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-brand-500"
              placeholder="Outlet Supervisor"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 text-base font-bold text-white transition active:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Setting up…' : 'Start onboarding'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

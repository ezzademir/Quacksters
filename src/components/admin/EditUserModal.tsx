import { useState } from 'react'
import type { AccessRole } from '../../types/auth'
import type { RoleFilter } from '../../types/onboarding'
import type { AdminUserRow } from '../../types/admin'
import { useOutlets } from '../../context/OutletsContext'
import { ACCESS_ROLE_LABELS } from '../../lib/permissions'

const accessRoles: AccessRole[] = [
  'pending',
  'hire',
  'supervisor',
  'gm',
  'exco',
  'hr_ops',
  'admin',
]

const jobRoles: RoleFilter[] = ['cook', 'cashier', 'supervisor']

interface EditUserModalProps {
  user: AdminUserRow
  onClose: () => void
  onSave: (payload: {
    full_name: string
    access_role: AccessRole
    assigned_outlet: string | null
    job_role: RoleFilter | null
    hire_outlet: string | null
    start_date: string | null
    buddy: string | null
    hire_supervisor: string | null
    password_reset_required: boolean
  }) => Promise<{ error: string | null }>
}

export function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const { outletNames } = useOutlets()
  const [fullName, setFullName] = useState(user.full_name)
  const [accessRole, setAccessRole] = useState<AccessRole>(user.access_role)
  const [assignedOutlet, setAssignedOutlet] = useState(user.assigned_outlet ?? '')
  const [jobRole, setJobRole] = useState<RoleFilter>(user.job_role ?? 'cook')
  const [hireOutlet, setHireOutlet] = useState(
    user.hire_outlet ?? user.assigned_outlet ?? outletNames[0] ?? '',
  )
  const [startDate, setStartDate] = useState(
    user.start_date ?? new Date().toISOString().slice(0, 10),
  )
  const [buddy, setBuddy] = useState(user.buddy ?? 'Assigned on Day 1')
  const [hireSupervisor, setHireSupervisor] = useState(
    user.hire_supervisor ?? 'Outlet Supervisor',
  )
  const [passwordResetRequired, setPasswordResetRequired] = useState(
    user.password_reset_required ?? false,
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isHire = accessRole === 'hire'
  const needsOutlet = accessRole === 'supervisor' || accessRole === 'gm' || isHire

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await onSave({
      full_name: fullName.trim(),
      access_role: accessRole,
      assigned_outlet: assignedOutlet || null,
      job_role: isHire ? jobRole : null,
      hire_outlet: isHire ? hireOutlet : null,
      start_date: isHire ? startDate : null,
      buddy: isHire ? buddy : null,
      hire_supervisor: isHire ? hireSupervisor : null,
      password_reset_required: passwordResetRequired,
    })

    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-xl font-bold text-slate-900">Edit user</h3>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Access role</span>
            <select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as AccessRole)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
            >
              {accessRoles.map((role) => (
                <option key={role} value={role}>
                  {ACCESS_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50/80 px-3 py-3 ring-1 ring-amber-200">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300 text-brand-600"
              checked={passwordResetRequired}
              onChange={(e) => setPasswordResetRequired(e.target.checked)}
            />
            <span>
              <span className="text-sm font-semibold text-slate-800">
                Require password change on next sign-in
              </span>
              <span className="mt-1 block text-xs text-slate-600">
                User must set a new password before using the mobile app or admin console.
              </span>
            </span>
          </label>

          {needsOutlet && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                {isHire ? 'Assigned outlet' : 'Outlet'}
              </span>
              <select
                value={isHire ? hireOutlet : assignedOutlet}
                onChange={(e) => {
                  const value = e.target.value
                  if (isHire) setHireOutlet(value)
                  setAssignedOutlet(value)
                }}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
              >
                {outletNames.map((outlet) => (
                  <option key={outlet} value={outlet}>
                    {outlet}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!isHire && accessRole !== 'supervisor' && accessRole !== 'gm' && (
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Outlet (optional)
              </span>
              <select
                value={assignedOutlet}
                onChange={(e) => setAssignedOutlet(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
              >
                <option value="">—</option>
                {outletNames.map((outlet) => (
                  <option key={outlet} value={outlet}>
                    {outlet}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isHire && (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Job role</span>
                <select
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value as RoleFilter)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
                >
                  {jobRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Start date</span>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Buddy</span>
                <input
                  value={buddy}
                  onChange={(e) => setBuddy(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Supervisor</span>
                <input
                  value={hireSupervisor}
                  onChange={(e) => setHireSupervisor(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

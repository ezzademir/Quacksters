import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PendingRegistration } from '../../types/auth'
import type { AccessRole } from '../../types/auth'
import type { RoleFilter } from '../../types/onboarding'
import { useOutlets } from '../../context/OutletsContext'
import { requireSupabase } from '../../lib/supabase'
import { ACCESS_ROLE_LABELS } from '../../lib/permissions'

const jobRoles: RoleFilter[] = ['cook', 'cashier', 'supervisor']
const approvalRoles: AccessRole[] = [
  'hire',
  'supervisor',
  'gm',
  'hr_ops',
  'exco',
  'admin',
]

interface ApproveRegistrationModalProps {
  registration: PendingRegistration
  onClose: () => void
  onComplete: () => void
}

export function ApproveRegistrationModal({
  registration,
  onClose,
  onComplete,
}: ApproveRegistrationModalProps) {
  const { outletNames } = useOutlets()
  const [accessRole, setAccessRole] = useState<AccessRole>('hire')
  const [outlet, setOutlet] = useState(
    registration.requested_outlet || outletNames[0] || '',
  )
  const [jobRole, setJobRole] = useState<RoleFilter>(
    registration.requested_job_role || 'cook',
  )
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [buddy, setBuddy] = useState('Assigned on Day 1')
  const [supervisor, setSupervisor] = useState('Outlet Supervisor')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = async () => {
    setError(null)
    setIsSubmitting(true)
    const client = requireSupabase()
    const { error: rpcError } = await client.rpc('approve_registration', {
      p_registration_id: registration.id,
      p_access_role: accessRole,
      p_assigned_outlet: outlet,
      p_job_role: accessRole === 'hire' ? jobRole : null,
      p_start_date: accessRole === 'hire' ? startDate : null,
      p_buddy: buddy,
      p_supervisor: supervisor,
    })
    setIsSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold text-slate-900">Approve registration</h3>
        <p className="mt-1 text-sm text-slate-600">
          {registration.full_name} · {registration.email}
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Access role
            </span>
            <select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as AccessRole)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
            >
              {approvalRoles.map((role) => (
                <option key={role} value={role}>
                  {ACCESS_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Outlet</span>
            <select
              value={outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3"
            >
              {outletNames.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>

          {accessRole === 'hire' && (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Job role
                </span>
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
                <span className="text-sm font-semibold text-slate-700">
                  Start date
                </span>
                <input
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
                <span className="text-sm font-semibold text-slate-700">
                  Supervisor
                </span>
                <input
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
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
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleApprove()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface RejectModalProps {
  registration: PendingRegistration
  onClose: () => void
  onComplete: () => void
}

function RejectModal({ registration, onClose, onComplete }: RejectModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReject = async () => {
    setError(null)
    setIsSubmitting(true)
    const client = requireSupabase()
    const { error: rpcError } = await client.rpc('reject_registration', {
      p_registration_id: registration.id,
      p_reason: reason.trim() || null,
    })
    setIsSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold text-slate-900">Reject registration</h3>
        <p className="mt-1 text-sm text-slate-600">{registration.full_name}</p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            Reason (optional)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleReject()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {isSubmitting ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RegistrationQueue() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [approveTarget, setApproveTarget] = useState<PendingRegistration | null>(
    null,
  )
  const [rejectTarget, setRejectTarget] = useState<PendingRegistration | null>(
    null,
  )

  const load = async () => {
    setIsLoading(true)
    const client = requireSupabase()
    const { data, error } = await client
      .from('pending_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    if (!error && data) {
      setRegistrations(data as PendingRegistration[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleComplete = () => {
    setApproveTarget(null)
    setRejectTarget(null)
    void load()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Registration queue</h2>
      <p className="mt-1 text-slate-600">
        Review self-registrations and assign roles before onboarding starts.
      </p>

      {isLoading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : registrations.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-slate-500 ring-1 ring-slate-200">
          No pending registrations.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {registrations.map((reg) => (
            <li
              key={reg.id}
              className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{reg.full_name}</p>
                <p className="text-sm text-slate-500">{reg.email}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {reg.requested_outlet && `${reg.requested_outlet} · `}
                  {reg.requested_job_role &&
                    `${reg.requested_job_role.charAt(0).toUpperCase()}${reg.requested_job_role.slice(1)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(reg)}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setApproveTarget(reg)}
                  className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {approveTarget && (
        <ApproveRegistrationModal
          registration={approveTarget}
          onClose={() => setApproveTarget(null)}
          onComplete={handleComplete}
        />
      )}
      {rejectTarget && (
        <RejectModal
          registration={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}

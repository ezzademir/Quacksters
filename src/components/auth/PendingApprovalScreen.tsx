import { Clock, LogOut, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function PendingApprovalScreen() {
  const { pendingRegistration, profile, signOut } = useAuth()

  const isRejected = pendingRegistration?.status === 'rejected'

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-400 to-brand-600 px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            {isRejected ? (
              <XCircle className="h-7 w-7 text-red-600" />
            ) : (
              <Clock className="h-7 w-7 text-brand-700" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {isRejected ? 'Registration declined' : 'Awaiting HR approval'}
          </h1>

          <p className="mt-2 text-slate-600">
            {isRejected
              ? 'Your registration was reviewed and could not be approved at this time.'
              : 'Your account is pending review by HR Operations. You will be notified once approved.'}
          </p>

          {profile && (
            <dl className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Name</dt>
                <dd className="text-slate-900">{profile.full_name}</dd>
              </div>
              {pendingRegistration?.requested_outlet && (
                <div>
                  <dt className="font-medium text-slate-500">Requested outlet</dt>
                  <dd className="text-slate-900">
                    {pendingRegistration.requested_outlet}
                  </dd>
                </div>
              )}
              {pendingRegistration?.requested_job_role && (
                <div>
                  <dt className="font-medium text-slate-500">Requested role</dt>
                  <dd className="capitalize text-slate-900">
                    {pendingRegistration.requested_job_role}
                  </dd>
                </div>
              )}
              {isRejected && pendingRegistration?.rejection_reason && (
                <div>
                  <dt className="font-medium text-slate-500">Reason</dt>
                  <dd className="text-slate-900">
                    {pendingRegistration.rejection_reason}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            {isRejected && (
              <Link
                to="/register"
                className="text-center text-sm font-semibold text-brand-700"
              >
                Register again with a different email
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

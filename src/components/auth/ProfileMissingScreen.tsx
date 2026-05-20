import { useAuth } from '../../context/AuthContext'

export function ProfileMissingScreen() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <h1 className="text-xl font-bold text-slate-900">Profile not found</h1>
      <p className="mt-2 max-w-sm text-slate-600">
        Your account is signed in but no profile record was loaded. Ask HR to
        verify your account, or sign out and try again.
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white"
      >
        Sign out
      </button>
    </div>
  )
}

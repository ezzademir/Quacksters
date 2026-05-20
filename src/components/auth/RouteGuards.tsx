import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  canAccessAdmin,
  canManageProgramme,
  canManageUsers,
  canViewAuditLog,
  canViewManagerChecklist,
  isApprovedUser,
} from '../../lib/permissions'
import { ProfileMissingScreen } from './ProfileMissingScreen'

function AuthLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  )
}

/** Signed-in users only (Supabase optional in offline mode). */
export function RequireAuth() {
  const { session, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}

/** Login/register only when signed out. */
export function RequireGuest() {
  const { session, profile, isLoading, isConfigured, canAccessAdmin } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (session && !profile) return <ProfileMissingScreen />
  if (session) {
    if (canAccessAdmin && profile?.access_role !== 'hire') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/** Approved users (not pending). Used for mobile app routes. */
export function RequireApproved() {
  const { profile, session, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (session && !profile) return <ProfileMissingScreen />

  if (profile?.password_reset_required) {
    return <Navigate to="/reset-password" replace />
  }

  if (profile?.access_role === 'pending') {
    return <Navigate to="/pending" replace />
  }

  if (!isApprovedUser(profile?.access_role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Admin console routes — block until password is changed if required. */
export function RequireAdminSession() {
  const { profile, session, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (session && !profile) return <ProfileMissingScreen />

  if (profile?.password_reset_required) {
    return <Navigate to="/reset-password" replace />
  }

  return <Outlet />
}

/** Shared admin gate — returns a blocking screen/redirect, or null when allowed. */
export function useAdminAccessGate() {
  const { profile, session, isLoading, isConfigured } = useAuth()

  if (!isConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600">
          Supabase is not configured. Set environment variables to use the admin
          console.
        </p>
      </div>
    )
  }

  if (isLoading) return <AuthLoading />
  if (session && !profile) return <ProfileMissingScreen />

  if (profile?.access_role === 'pending') {
    return <Navigate to="/pending" replace />
  }

  if (!canAccessAdmin(profile?.access_role)) {
    return <Navigate to="/" replace />
  }

  return null
}

/** Admin console — must be signed in with an admin access role. */
export function RequireAdminAccess() {
  const gate = useAdminAccessGate()
  if (gate) return gate
  return <Outlet />
}

/** User management page — admin, hr_ops, and gm only. */
export function RequireCanManageUsers() {
  const { profile, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (!canManageUsers(profile?.access_role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

/** Manager checklist page — outlet managers only (not system admin). */
export function RequireManagerChecklist() {
  const { profile, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (!canViewManagerChecklist(profile?.access_role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

/** Programme CMS — system admin only. */
export function RequireManageProgramme() {
  const { profile, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (!canManageProgramme(profile?.access_role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

/** Audit log — admin and HR Ops. */
export function RequireViewAuditLog() {
  const { profile, isLoading, isConfigured } = useAuth()

  if (!isConfigured) return <Outlet />
  if (isLoading) return <AuthLoading />
  if (!canViewAuditLog(profile?.access_role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

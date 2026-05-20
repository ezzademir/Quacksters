import type { AccessRole } from '../types/auth'

export const ADMIN_ROLES: AccessRole[] = [
  'admin',
  'hr_ops',
  'gm',
  'exco',
  'supervisor',
]

export const REGISTRATION_MANAGER_ROLES: AccessRole[] = ['admin', 'hr_ops']

export const USER_MANAGER_ROLES: AccessRole[] = ['admin', 'hr_ops', 'gm']

export const ACCESS_ROLE_LABELS: Record<AccessRole, string> = {
  pending: 'Pending approval',
  hire: 'New hire',
  supervisor: 'Supervisor (SUP)',
  gm: 'General Manager (GM)',
  exco: 'Executive Committee (EXCO)',
  hr_ops: 'HR Operations',
  admin: 'System admin',
}

export function canAccessAdmin(role: AccessRole | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

export function canManageRegistrations(role: AccessRole | null | undefined): boolean {
  return !!role && REGISTRATION_MANAGER_ROLES.includes(role)
}

export function canManageUsers(role: AccessRole | null | undefined): boolean {
  return !!role && USER_MANAGER_ROLES.includes(role)
}

export function canManageProgramme(role: AccessRole | null | undefined): boolean {
  return role === 'admin'
}

/** Admin + HR Ops can read audit log (see /admin/audit). Programme CMS remains admin-only. */
export function canViewAuditLog(role: AccessRole | null | undefined): boolean {
  return role === 'admin' || role === 'hr_ops'
}

export function canEditUserRoles(role: AccessRole | null | undefined): boolean {
  return role === 'admin' || role === 'hr_ops'
}

export function canEditUsers(role: AccessRole | null | undefined): boolean {
  return canEditUserRoles(role)
}

export function isApprovedUser(role: AccessRole | null | undefined): boolean {
  return !!role && role !== 'pending'
}

export function isHireUser(role: AccessRole | null | undefined): boolean {
  return role === 'hire'
}

export function canViewHireInOutlet(
  viewerRole: AccessRole | null | undefined,
  viewerOutlet: string | null | undefined,
  hireOutlet: string,
): boolean {
  if (!viewerRole) return false
  if (viewerRole === 'admin') return true
  if (
    (viewerRole === 'hr_ops' || viewerRole === 'exco') &&
    !viewerOutlet
  ) {
    return true
  }
  if (!viewerOutlet) return false
  return viewerOutlet === hireOutlet
}

export { canViewManagerChecklist, requiresAssignedOutlet } from './managerChecklist'

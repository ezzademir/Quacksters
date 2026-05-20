import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  ScrollText,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import type { AccessRole } from '../../types/auth'
import { useAuth } from '../../context/AuthContext'
import { ProgrammeStatusBanner } from './ProgrammeStatusBanner'
import {
  ACCESS_ROLE_LABELS,
  canViewAuditLog,
  canViewManagerChecklist,
} from '../../lib/permissions'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  {
    to: '/admin/programme',
    label: 'Programme',
    icon: NotebookPen,
    programmeManagement: true as const,
  },
  {
    to: '/admin/audit',
    label: 'Audit log',
    icon: ScrollText,
    auditLog: true as const,
  },
  {
    to: '/admin/checklist',
    label: 'My checklist',
    icon: ListChecks,
    managerChecklist: true as const,
  },
  {
    to: '/admin/registrations',
    label: 'Registrations',
    icon: UserCheck,
    roles: ['admin', 'hr_ops'] as const,
  },
  { to: '/admin/users', label: 'Users', icon: Users, usersManagement: true as const },
]

function AdminNav({
  canManageRegistrations,
  canManageUsers,
  canManageProgramme: canEditProgramme,
  canViewAuditLogNav,
  profileRole,
  className,
  onItemClick,
}: {
  canManageRegistrations: boolean
  canManageUsers: boolean
  canManageProgramme: boolean
  canViewAuditLogNav: boolean
  profileRole: string | undefined
  className?: string
  /** e.g. close mobile drawer after navigation */
  onItemClick?: () => void
}) {
  const visibleItems = navItems.filter((item) => {
    if ('programmeManagement' in item && item.programmeManagement) {
      return canEditProgramme
    }
    if ('auditLog' in item && item.auditLog) {
      return canViewAuditLogNav
    }
    if ('managerChecklist' in item && item.managerChecklist) {
      return canViewManagerChecklist(profileRole as AccessRole)
    }
    if ('usersManagement' in item && item.usersManagement) {
      return canManageUsers
    }
    if (!item.roles) return true
    if (!canManageRegistrations) return false
    return item.roles.includes(profileRole as (typeof item.roles)[number])
  })

  return (
    <ul className={`list-none ${className ?? ''}`}>
      {visibleItems.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={() => onItemClick?.()}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? 'bg-brand-100 text-brand-900'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function AdminLayout() {
  const {
    profile,
    signOut,
    canManageRegistrations,
    canManageUsers,
    canManageProgramme: canEditProgramme,
  } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const auditNav = canViewAuditLog(profile?.access_role)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  useEffect(() => {
    closeDrawer()
  }, [closeDrawer, location.pathname])

  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [drawerOpen, closeDrawer])

  const sharedNavProps = {
    canManageRegistrations,
    canManageUsers,
    canManageProgramme: canEditProgramme,
    canViewAuditLogNav: auditNav,
    profileRole: profile?.access_role,
  } as const

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4 md:flex-nowrap md:justify-between">
          <button
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="admin-nav-drawer"
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setDrawerOpen((o) => !o)}
            className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <div className="min-w-0 flex-1 md:flex-none">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Quacksters Admin
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">
              {profile?.full_name}
            </h1>
            <p className="truncate text-sm text-slate-500">
              {profile ? ACCESS_ROLE_LABELS[profile.access_role] : ''}
              {profile?.assigned_outlet ? ` · ${profile.assigned_outlet}` : ''}
            </p>
          </div>

          <div className="flex w-full shrink-0 items-center justify-end gap-2 md:w-auto md:gap-3">
            <Link
              to="/"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Mobile app
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — md+ unchanged sidebar below */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeDrawer}
          />
          <div
            id="admin-nav-drawer"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-3rem))] flex-col bg-white shadow-xl transition-transform duration-200 ease-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p
                id="admin-drawer-title"
                className="text-sm font-bold text-slate-900"
              >
                Navigation
              </p>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={closeDrawer}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <AdminNav
                {...sharedNavProps}
                onItemClick={closeDrawer}
                className="space-y-1"
              />
            </nav>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav className="hidden w-56 shrink-0 md:block">
          <AdminNav {...sharedNavProps} className="space-y-1" />
        </nav>

        <main className="min-w-0 flex-1">
          <ProgrammeStatusBanner />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ListChecks, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { canViewManagerChecklist, requiresAssignedOutlet } from '../../lib/permissions'
import { requireSupabase } from '../../lib/supabase'

interface DashboardStats {
  pendingRegistrations: number
  activeHires: number
  totalUsers: number
}

export function AdminDashboard() {
  const { canManageRegistrations, profile, canManageUsers } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    pendingRegistrations: 0,
    activeHires: 0,
    totalUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const outlet = profile?.assigned_outlet
  const role = profile?.access_role
  const showChecklist = canViewManagerChecklist(role)
  const showActiveHires = role !== 'supervisor'
  const showUsersCard = canManageUsers

  useEffect(() => {
    async function load() {
      const client = requireSupabase()

      let hiresQuery = showActiveHires
        ? client
            .from('hire_profiles')
            .select('user_id', { count: 'exact', head: true })
        : null

      if (
        hiresQuery &&
        outlet &&
        role &&
        requiresAssignedOutlet(role)
      ) {
        hiresQuery = hiresQuery.eq('outlet', outlet)
      }

      const usersPromise =
        showUsersCard && role
          ? client.rpc('admin_list_users')
          : Promise.resolve({ data: null, error: null })

      const [pending, hires, usersRes] = await Promise.all([
        canManageRegistrations
          ? client
              .from('pending_registrations')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending')
          : Promise.resolve({ count: 0 }),
        hiresQuery ?? Promise.resolve({ count: 0 }),
        usersPromise,
      ])

      setStats({
        pendingRegistrations: pending.count ?? 0,
        activeHires: hires.count ?? 0,
        totalUsers: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
      })
      setIsLoading(false)
    }

    void load()
  }, [
    canManageRegistrations,
    outlet,
    role,
    showActiveHires,
    showUsersCard,
  ])

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      <p className="mt-1 text-slate-600">
        {outlet
          ? `Overview for ${outlet}.`
          : 'Overview of registrations and onboarding activity.'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showChecklist && (
          <Link
            to="/admin/checklist"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
          >
            <ListChecks className="h-6 w-6 text-brand-600" />
            <p className="mt-3 text-lg font-bold text-slate-900">My checklist</p>
            <p className="text-sm text-slate-500">
              Your onboarding responsibilities
            </p>
          </Link>
        )}

        {canManageRegistrations && (
          <Link
            to="/admin/registrations"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
          >
            <ClipboardList className="h-6 w-6 text-brand-600" />
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {isLoading ? '—' : stats.pendingRegistrations}
            </p>
            <p className="text-sm text-slate-500">Pending registrations</p>
          </Link>
        )}

        {showActiveHires && (
          <Link
            to={canManageUsers ? '/admin/users' : '/admin/checklist'}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
          >
            <Users className="h-6 w-6 text-brand-600" />
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {isLoading ? '—' : stats.activeHires}
            </p>
            <p className="text-sm text-slate-500">
              {outlet ? `Active hires at ${outlet}` : 'Active hires'}
            </p>
          </Link>
        )}

        {showUsersCard && (
          <Link
            to="/admin/users"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
          >
            <Users className="h-6 w-6 text-slate-600" />
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {isLoading ? '—' : stats.totalUsers}
            </p>
            <p className="text-sm text-slate-500">
              {outlet ? `Users in ${outlet} scope` : 'Users in scope'}
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}

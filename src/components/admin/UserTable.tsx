import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import type { AccessRole } from '../../types/auth'
import type { RoleFilter } from '../../types/onboarding'
import type { AdminUserRow } from '../../types/admin'
import { useAuth } from '../../context/AuthContext'
import { requireSupabase } from '../../lib/supabase'
import {
  ACCESS_ROLE_LABELS,
  canEditUsers,
  canViewHireInOutlet,
  requiresAssignedOutlet,
} from '../../lib/permissions'
import { EditUserModal } from './EditUserModal'

export function UserTable() {
  const { profile: currentProfile } = useAuth()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)

  const editable = canEditUsers(currentProfile?.access_role)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const client = requireSupabase()
    const { data, error: fetchError } = await client.rpc('admin_list_users')

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    setUsers((data ?? []) as AdminUserRow[])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveUser = async (
    userId: string,
    payload: {
      full_name: string
      access_role: AccessRole
      assigned_outlet: string | null
      job_role: RoleFilter | null
      hire_outlet: string | null
      start_date: string | null
      buddy: string | null
      hire_supervisor: string | null
      password_reset_required: boolean
    },
  ) => {
    const client = requireSupabase()
    const { error: updateError } = await client.rpc('admin_update_user', {
      p_user_id: userId,
      p_full_name: payload.full_name,
      p_access_role: payload.access_role,
      p_assigned_outlet: payload.assigned_outlet,
      p_job_role: payload.job_role,
      p_hire_outlet: payload.hire_outlet,
      p_start_date: payload.start_date,
      p_buddy: payload.buddy,
      p_hire_supervisor: payload.hire_supervisor,
      p_password_reset_required: payload.password_reset_required,
    })

    if (updateError) return { error: updateError.message }
    await load()
    return { error: null }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Users</h2>
      <p className="mt-1 text-slate-600">
        {currentProfile?.assigned_outlet &&
        requiresAssignedOutlet(currentProfile.access_role)
          ? `Showing users for ${currentProfile.assigned_outlet}. `
          : ''}
        {editable
          ? 'Edit access roles, outlets, and hire onboarding details.'
          : 'View users in your scope. Contact admin to make changes.'}
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-slate-500 ring-1 ring-slate-200">
          No users found.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Access role</th>
                <th className="px-4 py-3">Outlet</th>
                <th className="px-4 py-3">Hire details</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {user.full_name || '—'}
                      {user.password_reset_required && (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          Password reset
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {ACCESS_ROLE_LABELS[user.access_role]}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.assigned_outlet ?? user.hire_outlet ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.job_role ? (
                      <span>
                        {user.job_role} · {user.hire_outlet} · {user.start_date}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {editable && (
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      )}
                      {user.access_role === 'hire' &&
                        user.job_role &&
                        user.hire_outlet &&
                        canViewHireInOutlet(
                          currentProfile?.access_role,
                          currentProfile?.assigned_outlet,
                          user.hire_outlet,
                        ) && (
                          <Link
                            to={`/admin/hires/${user.id}`}
                            className="text-xs font-semibold text-brand-700 hover:underline"
                          >
                            Progress
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(payload) => saveUser(editingUser.id, payload)}
        />
      )}
    </div>
  )
}

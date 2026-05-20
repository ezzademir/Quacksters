import type { AccessRole } from '../types/auth'
import type { RoleFilter } from '../types/onboarding'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string
  access_role: AccessRole
  assigned_outlet: string | null
  last_login: string | null
  created_at: string
  job_role: RoleFilter | null
  hire_outlet: string | null
  start_date: string | null
  buddy: string | null
  hire_supervisor: string | null
  confirmed_at: string | null
  password_reset_required?: boolean
}

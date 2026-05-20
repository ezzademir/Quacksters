import type { RoleFilter } from './onboarding'

export type AccessRole =
  | 'pending'
  | 'hire'
  | 'supervisor'
  | 'gm'
  | 'exco'
  | 'hr_ops'
  | 'admin'

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  access_role: AccessRole
  assigned_outlet: string | null
  last_login: string | null
  password_reset_required: boolean
  created_at: string
  updated_at: string
}

export interface PendingRegistration {
  id: string
  user_id: string
  email: string
  full_name: string
  requested_outlet: string | null
  requested_job_role: RoleFilter | null
  requested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  status: RegistrationStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface HireProfile {
  user_id: string
  job_role: RoleFilter
  outlet: string
  start_date: string
  buddy: string
  supervisor: string
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export interface ServerOnboardingProgress {
  user_id: string
  completed_task_ids: string[]
  last_updated: string
  created_at: string
}

export interface ProfileWithHire extends Profile {
  hire_profiles?: HireProfile | null
  onboarding_progress?: ServerOnboardingProgress | null
}

export type OwnerCode = 'EXCO' | 'GM' | 'SUP' | 'HIRE' | 'ALL'

export type RoleFilter = 'cook' | 'cashier' | 'supervisor' | 'all'

export type ResourceCategory = 'document' | 'contact' | 'training' | 'policy'

export type TabId = 'dashboard' | 'tasks' | 'resources'

/** Job role for checklist filtering (Cook / Cashier / Supervisor). */
export interface UserProfile {
  id: string
  name: string
  /** Job role — not the login access role (see auth Profile.access_role). */
  role: RoleFilter
  outlet: string
  startDate: string
  buddy: string
  supervisor: string
}

export function hireProfileToUserProfile(
  userId: string,
  fullName: string,
  hire: {
    job_role: RoleFilter
    outlet: string
    start_date: string
    buddy: string
    supervisor: string
  },
): UserProfile {
  return {
    id: userId,
    name: fullName,
    role: hire.job_role,
    outlet: hire.outlet,
    startDate: hire.start_date,
    buddy: hire.buddy,
    supervisor: hire.supervisor,
  }
}

export type TaskAudience = 'hire' | 'internal'

export interface OnboardingTask {
  id: string
  title: string
  whyItMatters?: string
  howTo?: string
  owner: OwnerCode
  roles: RoleFilter[]
  /** Mobile hire app visibility. Defaults to hire when omitted. */
  audience?: TaskAudience
  /** Hire-facing copy (mobile app). Falls back to title / whyItMatters / howTo. */
  titleHire?: string
  whyItMattersHire?: string
  howToHire?: string
}

export interface ResolvedHireTask {
  id: string
  title: string
  whyItMatters?: string
  howTo?: string
  owner: OwnerCode
}

export interface TaskSection {
  id: string
  title: string
  subtitle?: string
  tasks: OnboardingTask[]
}

export interface OnboardingPhase {
  id: string
  number: number
  title: string
  subtitle: string
  dayRange: string
  description: string
  sections: TaskSection[]
  milestones?: string[]
  milestonesByRole?: Partial<Record<RoleFilter, string[]>>
  descriptionByRole?: Partial<Record<RoleFilter, string>>
}

export interface Resource {
  id: string
  title: string
  description: string
  category: ResourceCategory
  reference?: string
  url?: string
  owner?: OwnerCode
  roles: RoleFilter[]
}

export interface ContactPerson {
  id: string
  name: string
  role: string
  ownerCode: OwnerCode
  responsibility: string
  contactHint: string
}

export interface OnboardingProgress {
  completedTaskIds: string[]
  lastUpdated: string
}

export interface PhaseProgress {
  phaseId: string
  completed: number
  total: number
  percentage: number
}

export interface MilestoneReminder {
  dayNumber: number
  label: string
  method: string
  owner: string
  date: string
  status: 'past' | 'today' | 'upcoming'
}

export interface FeedbackScheduleItem {
  id?: string
  day: string
  dayNumber: number
  method: string
  owner: string
}

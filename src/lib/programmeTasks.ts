import type { OnboardingPhase, RoleFilter, UserProfile } from '../types/onboarding'

export function getAllTasks(phases: OnboardingPhase[]) {
  return phases.flatMap((phase) =>
    phase.sections.flatMap((section) => section.tasks),
  )
}

export function getTasksForRole(
  role: UserProfile['role'],
  phases: OnboardingPhase[],
) {
  return getAllTasks(phases).filter(
    (task) => task.roles.includes('all') || task.roles.includes(role),
  )
}

export function getHireTaskCountForRole(
  role: UserProfile['role'],
  phases: OnboardingPhase[],
) {
  return getAllTasks(phases).filter(
    (task) =>
      (task.roles.includes('all') || task.roles.includes(role)) &&
      task.audience !== 'internal',
  ).length
}

export function filterValidCompletedIds(
  completedIds: string[],
  phases: OnboardingPhase[],
): string[] {
  const valid = new Set(getAllTasks(phases).map((t) => t.id))
  return completedIds.filter((id) => valid.has(id))
}

export const JOB_ROLE_OPTIONS: RoleFilter[] = ['cook', 'cashier', 'supervisor']

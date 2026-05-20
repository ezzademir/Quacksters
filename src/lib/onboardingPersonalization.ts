import {
  onboardingPhases,
  resources,
} from '../data/mockData'
import type {
  OnboardingPhase,
  OnboardingTask,
  ResolvedHireTask,
  Resource,
  RoleFilter,
  UserProfile,
} from '../types/onboarding'

const JOB_ROLES: RoleFilter[] = ['cook', 'cashier', 'supervisor']

export const roleLabels: Record<RoleFilter, string> = {
  cook: 'Cook',
  cashier: 'Cashier',
  supervisor: 'Supervisor',
  all: 'Team member',
}

export function isTaskForRole(task: OnboardingTask, role: RoleFilter): boolean {
  return task.roles.includes('all') || task.roles.includes(role)
}

export function isHireVisibleTask(task: OnboardingTask): boolean {
  return task.audience !== 'internal'
}

export function getHireTasksForRole(
  role: RoleFilter,
  phases: OnboardingPhase[] = onboardingPhases,
): OnboardingTask[] {
  return phases
    .flatMap((phase) => phase.sections.flatMap((section) => section.tasks))
    .filter((task) => isTaskForRole(task, role) && isHireVisibleTask(task))
}

export function resolveTaskForHire(task: OnboardingTask): ResolvedHireTask {
  return {
    id: task.id,
    title: task.titleHire ?? task.title,
    whyItMatters: task.whyItMattersHire ?? task.whyItMatters,
    howTo: task.howToHire ?? task.howTo,
    owner: task.owner,
  }
}

export function getPhaseDescriptionForRole(
  phase: OnboardingPhase,
  role: RoleFilter,
): string {
  return phase.descriptionByRole?.[role] ?? phase.description
}

export function getPhaseMilestonesForRole(
  phase: OnboardingPhase,
  role: RoleFilter,
): string[] {
  return phase.milestonesByRole?.[role] ?? phase.milestones ?? []
}

export function getPhasesForRole(
  role: RoleFilter,
  phases: OnboardingPhase[] = onboardingPhases,
): OnboardingPhase[] {
  const result: OnboardingPhase[] = []

  for (const phase of phases) {
    const sections = phase.sections
      .map((section) => ({
        ...section,
        tasks: section.tasks.filter(
          (task) => isTaskForRole(task, role) && isHireVisibleTask(task),
        ),
      }))
      .filter((section) => section.tasks.length > 0)

    if (sections.length === 0) continue

    result.push({
      ...phase,
      description: getPhaseDescriptionForRole(phase, role),
      milestones: getPhaseMilestonesForRole(phase, role),
      sections,
    })
  }

  return result
}

export function getResourcesForRole(
  role: RoleFilter,
  allResources: Resource[] = resources,
): Resource[] {
  return allResources.filter(
    (resource) =>
      resource.roles.includes('all') || resource.roles.includes(role),
  )
}

export function getRoleProgramSubtitle(role: RoleFilter): string {
  switch (role) {
    case 'cook':
      return 'Kitchen · 30 · 60 · 90 day path'
    case 'cashier':
      return 'Front of house · 30 · 60 · 90 day path'
    case 'supervisor':
      return 'Supervisor track · 30 · 60 · 90 day path'
    default:
      return '30 · 60 · 90 Day Integration Programme'
  }
}

export function getPersonalizedGreeting(profile: UserProfile): string {
  const firstName = profile.name.split(' ')[0] || profile.name
  return `Welcome, ${firstName}`
}

export function getPersonalizedDashboardSubtitle(profile: UserProfile): string {
  return `${roleLabels[profile.role]} at ${profile.outlet} · ${getRoleProgramSubtitle(profile.role)}`
}

export function getRoleLabel(role: RoleFilter): string {
  return roleLabels[role]
}

export function isJobRole(role: RoleFilter): role is (typeof JOB_ROLES)[number] {
  return JOB_ROLES.includes(role)
}

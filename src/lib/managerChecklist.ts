import type { AccessRole } from '../types/auth'
import type {
  OnboardingPhase,
  OnboardingTask,
  OwnerCode,
  PhaseProgress,
} from '../types/onboarding'

const MANAGER_CHECKLIST_ROLES: AccessRole[] = [
  'supervisor',
  'gm',
  'exco',
  'hr_ops',
]

export function canViewManagerChecklist(
  role: AccessRole | null | undefined,
): boolean {
  return !!role && MANAGER_CHECKLIST_ROLES.includes(role)
}

export function requiresAssignedOutlet(
  role: AccessRole | null | undefined,
): boolean {
  return (
    role === 'supervisor' ||
    role === 'gm' ||
    role === 'exco' ||
    role === 'hr_ops'
  )
}

export function getManagerOwnerCodes(role: AccessRole): OwnerCode[] {
  switch (role) {
    case 'supervisor':
      return ['SUP', 'ALL']
    case 'gm':
      return ['GM', 'ALL']
    case 'exco':
      return ['EXCO', 'ALL']
    case 'hr_ops':
      return ['GM', 'EXCO', 'ALL']
    default:
      return []
  }
}

export function isManagerOwnedTask(
  task: OnboardingTask,
  ownerCodes: OwnerCode[],
): boolean {
  if (task.owner === 'HIRE') return false
  return ownerCodes.includes(task.owner)
}

export function getManagerTasksForRole(
  role: AccessRole,
  phases: OnboardingPhase[],
): OnboardingTask[] {
  const ownerCodes = getManagerOwnerCodes(role)
  return phases
    .flatMap((phase) => phase.sections.flatMap((section) => section.tasks))
    .filter((task) => isManagerOwnedTask(task, ownerCodes))
}

export function getManagerPhasesForRole(
  role: AccessRole,
  phases: OnboardingPhase[],
): OnboardingPhase[] {
  const ownerCodes = getManagerOwnerCodes(role)
  const result: OnboardingPhase[] = []

  for (const phase of phases) {
    const sections = phase.sections
      .map((section) => ({
        ...section,
        tasks: section.tasks.filter((task) =>
          isManagerOwnedTask(task, ownerCodes),
        ),
      }))
      .filter((section) => section.tasks.length > 0)

    if (sections.length === 0) continue

    result.push({
      ...phase,
      description: getManagerPhaseDescription(role, phase),
      sections,
    })
  }

  return result
}

function getManagerPhaseDescription(
  role: AccessRole,
  phase: OnboardingPhase,
): string {
  switch (role) {
    case 'supervisor':
      return `Your supervisor responsibilities for ${phase.title.toLowerCase()} at your outlet.`
    case 'gm':
      return `Your GM responsibilities for ${phase.title.toLowerCase()} at your outlet.`
    case 'exco':
      return `Your EXCO responsibilities for ${phase.title.toLowerCase()}.`
    case 'hr_ops':
      return `HR coordination tasks for ${phase.title.toLowerCase()} at your outlet.`
    default:
      return phase.description
  }
}

export function getManagerChecklistTitle(role: AccessRole): string {
  switch (role) {
    case 'supervisor':
      return 'Supervisor onboarding checklist'
    case 'gm':
      return 'GM onboarding checklist'
    case 'exco':
      return 'EXCO onboarding checklist'
    case 'hr_ops':
      return 'HR operations checklist'
    default:
      return 'Manager checklist'
  }
}

export function computePhaseProgress(
  phases: OnboardingPhase[],
  completedIds: Set<string>,
): PhaseProgress[] {
  return phases.map((phase) => {
    const tasks = phase.sections.flatMap((s) => s.tasks)
    const completed = tasks.filter((t) => completedIds.has(t.id)).length
    const total = tasks.length
    return {
      phaseId: phase.id,
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  })
}

export function computeOverallProgress(
  tasks: OnboardingTask[],
  completedIds: Set<string>,
): { completed: number; total: number; percentage: number } {
  const total = tasks.length
  const completed = tasks.filter((t) => completedIds.has(t.id)).length
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

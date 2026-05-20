import { describe, expect, it } from 'vitest'
import { onboardingPhases } from '../data/mockData'
import {
  getHireTasksForRole,
  getPhaseDescriptionForRole,
  getPhaseMilestonesForRole,
  getPhasesForRole,
  getPersonalizedDashboardSubtitle,
  getResourcesForRole,
  resolveTaskForHire,
} from './onboardingPersonalization'

describe('onboardingPersonalization', () => {
  it('filters hire-visible tasks by role', () => {
    const cookTasks = getHireTasksForRole('cook', onboardingPhases)
    const cashierTasks = getHireTasksForRole('cashier', onboardingPhases)

    expect(cookTasks.length).toBeGreaterThan(0)
    expect(cashierTasks.length).toBeGreaterThan(0)
    expect(cookTasks.every((t) => t.audience !== 'internal')).toBe(true)
  })

  it('uses role-specific phase copy when present', () => {
    const phase = onboardingPhases[0]
    expect(phase.descriptionByRole?.cook).toBeDefined()

    expect(getPhaseDescriptionForRole(phase, 'cook')).toBe(
      phase.descriptionByRole!.cook,
    )
    expect(getPhaseDescriptionForRole(phase, 'cashier')).toBe(
      phase.descriptionByRole!.cashier,
    )
    expect(getPhaseDescriptionForRole(phase, 'cook')).not.toBe(phase.description)
  })

  it('falls back to default milestones when role override is missing', () => {
    const phase = onboardingPhases.find((p) => p.id === 'phase-1')
    expect(phase?.milestonesByRole?.cook).toBeDefined()
    if (!phase) return

    expect(getPhaseMilestonesForRole(phase, 'cook')).toEqual(
      phase.milestonesByRole!.cook,
    )

    const fallbackPhase = {
      ...phase,
      milestones: ['Default milestone'],
      milestonesByRole: { cook: ['Cook milestone'] },
    }
    expect(getPhaseMilestonesForRole(fallbackPhase, 'cook')).toEqual([
      'Cook milestone',
    ])
    expect(getPhaseMilestonesForRole(fallbackPhase, 'cashier')).toEqual([
      'Default milestone',
    ])
  })

  it('builds role-filtered phases with personalized copy', () => {
    const phases = getPhasesForRole('cook', onboardingPhases)
    expect(phases.length).toBeGreaterThan(0)
    expect(phases.every((p) => p.sections.some((s) => s.tasks.length > 0))).toBe(
      true,
    )
  })

  it('resolves hire-facing task labels', () => {
    const task = getHireTasksForRole('cook', onboardingPhases).find(
      (t) => t.titleHire,
    )
    expect(task).toBeDefined()
    if (!task) return

    const resolved = resolveTaskForHire(task)
    expect(resolved.title).toBe(task.titleHire)
  })

  it('filters resources by role', () => {
    const resources = getResourcesForRole('cook', [])
    expect(resources).toEqual([])
  })

  it('builds dashboard subtitle from profile', () => {
    const subtitle = getPersonalizedDashboardSubtitle({
      id: '1',
      name: 'Alex Tan',
      role: 'cook',
      outlet: 'TTDI',
      startDate: '2026-01-01',
      buddy: 'Sam',
      supervisor: 'Jordan',
    })
    expect(subtitle).toContain('TTDI')
    expect(subtitle).toContain('Cook')
  })
})

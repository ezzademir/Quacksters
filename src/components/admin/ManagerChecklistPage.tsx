import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Info, Users } from 'lucide-react'
import type { AccessRole } from '../../types/auth'
import type { OnboardingTask } from '../../types/onboarding'
import { useAuth } from '../../context/AuthContext'
import { useProgrammeContent } from '../../context/ProgrammeContentContext'
import {
  canViewManagerChecklist,
  requiresAssignedOutlet,
} from '../../lib/permissions'
import {
  computeOverallProgress,
  computePhaseProgress,
  getManagerChecklistTitle,
  getManagerPhasesForRole,
  getManagerTasksForRole,
} from '../../lib/managerChecklist'
import { requireSupabase } from '../../lib/supabase'
import { ProgressBar } from '../ui/Badge'
import { TaskCheckbox } from '../ui/TaskCheckbox'

interface OutletHireRow {
  user_id: string
  full_name: string
  job_role: string
  outlet: string
  start_date: string
  completed_tasks: number
}

function ManagerTaskItem({
  task,
  completed,
  onToggle,
}: {
  task: OnboardingTask
  completed: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = Boolean(task.whyItMatters || task.howTo)

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
        completed ? 'border-brand-100 bg-brand-50/30' : 'border-slate-100'
      }`}
    >
      <div className="flex gap-3">
        <TaskCheckbox
          checked={completed}
          onChange={onToggle}
          label={task.title}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold leading-snug ${
              completed ? 'text-slate-400 line-through' : 'text-slate-900'
            }`}
          >
            {task.title}
          </p>
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              <Info className="h-3.5 w-3.5" />
              {expanded ? 'Hide details' : 'Show details'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
          {expanded && (
            <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              {task.whyItMatters && (
                <p>
                  <span className="font-semibold text-slate-700">Why: </span>
                  {task.whyItMatters}
                </p>
              )}
              {task.howTo && (
                <p>
                  <span className="font-semibold text-slate-700">How: </span>
                  {task.howTo}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ManagerChecklistPage() {
  const { profile, session } = useAuth()
  const { phases: programmePhases } = useProgrammeContent()
  const accessRole = profile?.access_role as AccessRole | undefined
  const outlet = profile?.assigned_outlet

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null)
  const [outletHires, setOutletHires] = useState<OutletHireRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const phases = useMemo(
    () =>
      accessRole ? getManagerPhasesForRole(accessRole, programmePhases) : [],
    [accessRole, programmePhases],
  )
  const allTasks = useMemo(
    () =>
      accessRole ? getManagerTasksForRole(accessRole, programmePhases) : [],
    [accessRole, programmePhases],
  )
  const phaseProgress = useMemo(
    () => computePhaseProgress(phases, completedIds),
    [phases, completedIds],
  )
  const overall = useMemo(
    () => computeOverallProgress(allTasks, completedIds),
    [allTasks, completedIds],
  )

  const loadProgress = useCallback(async () => {
    if (!session?.user.id) return
    const client = requireSupabase()
    const { data, error: fetchError } = await client
      .from('manager_checklist_progress')
      .select('completed_task_ids')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    const ids = (data?.completed_task_ids as string[] | undefined) ?? []
    setCompletedIds(new Set(ids))
  }, [session?.user.id])

  const loadHires = useCallback(async () => {
    if (!outlet || !accessRole) {
      setOutletHires([])
      return
    }
    const client = requireSupabase()
    const { data, error: fetchError } = await client.rpc('admin_list_outlet_hires', {
      p_outlet: outlet,
    })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setOutletHires((data ?? []) as OutletHireRow[])
  }, [accessRole, outlet])

  useEffect(() => {
    if (!canViewManagerChecklist(accessRole)) {
      setIsLoading(false)
      return
    }

    async function init() {
      setIsLoading(true)
      setError(null)
      await Promise.all([loadProgress(), loadHires()])
      setIsLoading(false)
    }

    void init()
  }, [accessRole, loadHires, loadProgress])

  const persistProgress = useCallback(
    async (ids: string[]) => {
      if (!session?.user.id) return
      setSaveError(null)
      const client = requireSupabase()
      const { error: upsertError } = await client
        .from('manager_checklist_progress')
        .upsert({
          user_id: session.user.id,
          outlet: outlet ?? null,
          completed_task_ids: ids,
          last_updated: new Date().toISOString(),
        })

      if (upsertError) setSaveError(upsertError.message)
    },
    [outlet, session?.user.id],
  )

  const toggleTask = (taskId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      void persistProgress([...next])
      return next
    })
  }

  if (!canViewManagerChecklist(accessRole)) {
    return <Navigate to="/admin" replace />
  }

  if (requiresAssignedOutlet(accessRole) && !outlet) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <h2 className="text-lg font-bold text-amber-900">Outlet not assigned</h2>
        <p className="mt-2 text-sm text-amber-800">
          Your checklist is scoped to an outlet. Ask HR or a system admin to assign
          your outlet before you can view your responsibilities and active hires.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading your checklist…</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">
        {getManagerChecklistTitle(accessRole!)}
      </h2>
      <p className="mt-1 text-slate-600">
        {outlet
          ? `Your onboarding responsibilities at ${outlet}.`
          : 'Organisation-wide onboarding oversight checklist.'}
      </p>

      {(error || saveError) && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? saveError}
        </p>
      )}

      <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Your checklist progress</p>
            <p className="text-3xl font-bold text-slate-900">{overall.percentage}%</p>
            <p className="mt-1 text-sm text-slate-600">
              {overall.completed} of {overall.total} responsibilities complete
            </p>
          </div>
        </div>
        <ProgressBar percentage={overall.percentage} className="mt-4" />
      </section>

      {outlet && outletHires.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Users className="h-5 w-5 text-brand-600" />
            Active hires at {outlet}
          </h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {outletHires.map((hire) => (
              <li key={hire.user_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{hire.full_name}</p>
                  <p className="text-sm text-slate-500 capitalize">
                    {hire.job_role} · started {hire.start_date}
                  </p>
                </div>
                <Link
                  to={`/admin/hires/${hire.user_id}`}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  View progress
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 space-y-3">
        {phases.map((phase) => {
          const progress = phaseProgress.find((p) => p.phaseId === phase.id)
          const isOpen = expandedPhaseId === phase.id
          const taskCount = phase.sections.flatMap((s) => s.tasks).length

          return (
            <div
              key={phase.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
            >
              <button
                type="button"
                onClick={() => setExpandedPhaseId(isOpen ? null : phase.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Phase {phase.number} · {phase.dayRange}
                  </p>
                  <p className="font-bold text-slate-900">{phase.title}</p>
                  <p className="text-sm text-slate-500">
                    {progress?.completed ?? 0}/{taskCount} done ·{' '}
                    {progress?.percentage ?? 0}%
                  </p>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                  <p className="mb-4 text-sm text-slate-600">{phase.description}</p>
                  {phase.sections.map((section) => (
                    <div key={section.id} className="mb-4 last:mb-0">
                      <h4 className="mb-2 text-sm font-bold text-slate-800">
                        {section.title}
                      </h4>
                      <div className="space-y-2">
                        {section.tasks.map((task) => (
                          <ManagerTaskItem
                            key={task.id}
                            task={task}
                            completed={completedIds.has(task.id)}
                            onToggle={() => toggleTask(task.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Circle } from 'lucide-react'
import type { HireProfile, Profile, ServerOnboardingProgress } from '../../types/auth'
import {
  getPhasesForRole,
  getHireTasksForRole,
  resolveTaskForHire,
} from '../../lib/onboardingPersonalization'
import { getTasksForRole } from '../../lib/programmeTasks'
import { getMilestoneEvents } from '../../lib/milestones'
import { useProgrammeContent } from '../../context/ProgrammeContentContext'
import { requireSupabase } from '../../lib/supabase'
import {
  ACCESS_ROLE_LABELS,
  canViewHireInOutlet,
} from '../../lib/permissions'
import { useAuth } from '../../context/AuthContext'

export function HireDetailPanel() {
  const { id } = useParams<{ id: string }>()
  const { profile: viewerProfile, canManageUsers } = useAuth()
  const { phases, feedbackSchedule } = useProgrammeContent()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hireProfile, setHireProfile] = useState<HireProfile | null>(null)
  const [progress, setProgress] = useState<ServerOnboardingProgress | null>(
    null,
  )
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const backTo = canManageUsers ? '/admin/users' : '/admin/checklist'
  const backLabel = canManageUsers ? 'Back to users' : 'Back to checklist'

  useEffect(() => {
    if (!id) return

    async function load() {
      const client = requireSupabase()
      const [profileRes, hireRes, progressRes] = await Promise.all([
        client.from('profiles').select('*').eq('id', id).maybeSingle(),
        client.from('hire_profiles').select('*').eq('user_id', id).maybeSingle(),
        client
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', id)
          .maybeSingle(),
      ])

      if (profileRes.error || hireRes.error || progressRes.error) {
        setError(
          profileRes.error?.message ||
            hireRes.error?.message ||
            progressRes.error?.message ||
            'Failed to load hire',
        )
      } else {
        setProfile(profileRes.data as Profile)
        setHireProfile(hireRes.data as HireProfile | null)
        setProgress(progressRes.data as ServerOnboardingProgress | null)
      }
      setIsLoading(false)
    }

    void load()
  }, [id])

  const completedIds = useMemo(
    () => new Set(progress?.completed_task_ids ?? []),
    [progress],
  )

  const hirePhases = useMemo(
    () => (hireProfile ? getPhasesForRole(hireProfile.job_role, phases) : []),
    [hireProfile, phases],
  )

  const stats = useMemo(() => {
    if (!hireProfile) return null
    const hireTasks = getHireTasksForRole(hireProfile.job_role, phases)
    const allRoleTasks = getTasksForRole(hireProfile.job_role, phases)
    const done = hireTasks.filter((t) => completedIds.has(t.id)).length
    return {
      completed: done,
      total: hireTasks.length,
      internalTotal: allRoleTasks.length - hireTasks.length,
      percentage:
        hireTasks.length === 0
          ? 0
          : Math.round((done / hireTasks.length) * 100),
    }
  }, [completedIds, hireProfile, phases])

  const milestones = useMemo(
    () =>
      hireProfile
        ? getMilestoneEvents(hireProfile.start_date, feedbackSchedule)
        : [],
    [feedbackSchedule, hireProfile],
  )

  const accessDenied =
    hireProfile &&
    viewerProfile &&
    !canViewHireInOutlet(
      viewerProfile.access_role,
      viewerProfile.assigned_outlet,
      hireProfile.outlet,
    )

  if (isLoading) {
    return <p className="text-slate-500">Loading hire details…</p>
  }

  if (error || !profile) {
    return (
      <div>
        <Link
          to={backTo}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <p className="text-red-600">{error ?? 'Hire not found'}</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div>
        <Link
          to={backTo}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <p className="text-red-600">
          You do not have access to view this hire at their outlet.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <h2 className="text-2xl font-bold text-slate-900">{profile.full_name}</h2>
      <p className="mt-1 text-slate-600">
        {ACCESS_ROLE_LABELS[profile.access_role]}
      </p>

      {hireProfile && (
        <dl className="mt-6 grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              Job role
            </dt>
            <dd className="capitalize text-slate-900">{hireProfile.job_role}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              Outlet
            </dt>
            <dd className="text-slate-900">{hireProfile.outlet}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              Start date
            </dt>
            <dd className="text-slate-900">{hireProfile.start_date}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">
              Buddy / Supervisor
            </dt>
            <dd className="text-slate-900">
              {hireProfile.buddy} · {hireProfile.supervisor}
            </dd>
          </div>
        </dl>
      )}

      {stats && (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="font-semibold text-slate-900">Onboarding progress</h3>
          <p className="mt-2 text-3xl font-bold text-brand-700">
            {stats.percentage}%
          </p>
          <p className="text-sm text-slate-500">
            {stats.completed} of {stats.total} hire tasks completed
            {stats.internalTotal > 0 && (
              <span className="text-slate-400">
                {' '}
                · {stats.internalTotal} internal prep steps hidden from hire app
              </span>
            )}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {hirePhases.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Task checklist</h3>
          {hirePhases.map((phase) => {
            const tasks = phase.sections.flatMap((s) => s.tasks)
            const done = tasks.filter((t) => completedIds.has(t.id)).length
            const isOpen = expandedPhaseId === phase.id
            return (
              <div
                key={phase.id}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPhaseId(isOpen ? null : phase.id)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{phase.title}</p>
                    <p className="text-sm text-slate-500">
                      {done}/{tasks.length} complete
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <ul className="border-t border-slate-100 px-4 py-2">
                    {tasks.map((task) => {
                      const resolved = resolveTaskForHire(task)
                      const doneTask = completedIds.has(task.id)
                      return (
                        <li
                          key={task.id}
                          className="flex items-start gap-2 border-b border-slate-50 py-2 last:border-0"
                        >
                          {doneTask ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                          )}
                          <span
                            className={`text-sm ${
                              doneTask
                                ? 'text-slate-400 line-through'
                                : 'text-slate-800'
                            }`}
                          >
                            {resolved.title}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="font-semibold text-slate-900">Milestones</h3>
        <ul className="mt-3 space-y-2">
          {milestones.map((m) => (
            <li
              key={m.dayNumber}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-700">{m.label}</span>
              <span
                className={
                  m.status === 'past'
                    ? 'text-slate-400'
                    : m.status === 'today'
                      ? 'font-semibold text-brand-700'
                      : 'text-slate-500'
                }
              >
                {m.date.toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

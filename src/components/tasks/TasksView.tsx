import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext'
import { Header } from '../layout/Header'
import { TaskCheckbox } from '../ui/TaskCheckbox'
import type { OnboardingTask } from '../../types/onboarding'

function TaskItem({ task }: { task: OnboardingTask }) {
  const { isTaskCompleted, toggleTask, resolveTaskForHire } = useOnboarding()
  const [expanded, setExpanded] = useState(false)
  const completed = isTaskCompleted(task.id)
  const display = resolveTaskForHire(task)
  const hasDetails = Boolean(display.whyItMatters || display.howTo)

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition ${
        completed ? 'border-brand-100 bg-brand-50/30' : 'border-slate-100'
      }`}
    >
      <div className="flex gap-3">
        <TaskCheckbox
          checked={completed}
          onChange={() => toggleTask(task.id)}
          label={display.title}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold leading-snug ${
              completed ? 'text-slate-400 line-through' : 'text-slate-900'
            }`}
          >
            {display.title}
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
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {display.whyItMatters && (
                <p>
                  <span className="font-semibold text-slate-700">Why: </span>
                  {display.whyItMatters}
                </p>
              )}
              {display.howTo && (
                <p>
                  <span className="font-semibold text-slate-700">How: </span>
                  {display.howTo}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TasksView() {
  const {
    roleLabel,
    selectedPhaseId,
    setSelectedPhaseId,
    phaseProgress,
    relevantPhases,
    resetProgress,
  } = useOnboarding()

  const selectedPhase = selectedPhaseId
    ? relevantPhases.find((p) => p.id === selectedPhaseId)
    : null

  if (selectedPhase) {
    const progress = phaseProgress.find((p) => p.phaseId === selectedPhase.id)

    return (
      <>
        <Header
          title={selectedPhase.title}
          subtitle={selectedPhase.subtitle}
          showBack
          onBack={() => setSelectedPhaseId(null)}
        />
        <div className="space-y-6 px-4 py-4">
          <p className="text-sm text-slate-600">{selectedPhase.description}</p>

          {progress && (
            <p className="text-sm font-medium text-slate-500">
              {progress.completed}/{progress.total} of your tasks completed (
              {progress.percentage}%)
            </p>
          )}

          {selectedPhase.milestones && selectedPhase.milestones.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                Your milestones
              </p>
              <ul className="space-y-1.5">
                {selectedPhase.milestones.map((m) => (
                  <li key={m} className="flex gap-2 text-sm text-amber-900">
                    <span className="text-amber-500">✓</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedPhase.sections.map((section) => {
            if (section.tasks.length === 0) return null

            return (
              <section key={section.id}>
                <h2 className="mb-1 text-base font-bold text-slate-900">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="mb-3 text-sm text-slate-500">{section.subtitle}</p>
                )}
                <div className="space-y-3">
                  {section.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Your tasks" subtitle={`${roleLabel} onboarding roadmap`} />
      <div className="space-y-4 px-4 py-4">
        {relevantPhases.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            No tasks assigned to your role yet. Contact your supervisor if this
            looks wrong.
          </p>
        ) : (
          relevantPhases.map((phase) => {
            const progress = phaseProgress.find((p) => p.phaseId === phase.id)
            const taskCount = phase.sections.flatMap((s) => s.tasks).length

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => setSelectedPhaseId(phase.id)}
                className="flex w-full min-h-[72px] items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm active:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Phase {phase.number} · {phase.dayRange}
                  </p>
                  <p className="mt-0.5 font-bold text-slate-900">{phase.title}</p>
                  <p className="text-sm text-slate-500">
                    {progress?.completed ?? 0}/{taskCount} done
                  </p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                  {progress?.percentage ?? 0}%
                </span>
              </button>
            )
          })
        )}

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset all checklist progress? This cannot be undone.',
                )
              ) {
                void resetProgress()
              }
            }}
            className="w-full rounded-2xl border border-red-100 py-3 text-sm font-semibold text-red-600 active:bg-red-50"
          >
            Reset progress (dev only)
          </button>
        )}
      </div>
    </>
  )
}

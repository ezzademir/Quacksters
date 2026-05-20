import { ChevronRight, CircleDot } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext'

export function NextTaskCta() {
  const {
    nextIncompleteTask,
    relevantPhases,
    resolveTaskForHire,
    setActiveTab,
    setSelectedPhaseId,
  } = useOnboarding()

  if (!nextIncompleteTask) return null

  const display = resolveTaskForHire(nextIncompleteTask)
  const phase = relevantPhases.find((p) =>
    p.sections.some((s) => s.tasks.some((t) => t.id === nextIncompleteTask.id)),
  )

  const handleClick = () => {
    if (phase) setSelectedPhaseId(phase.id)
    setActiveTab('tasks')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full min-h-[72px] items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-left shadow-sm active:bg-brand-100"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-slate-900">
        <CircleDot className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
          Your next task
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
          {display.title}
        </p>
        {phase && (
          <p className="text-xs text-slate-500">{phase.title}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-brand-400" />
    </button>
  )
}

import { Check, ChevronRight } from 'lucide-react'
import type { OnboardingPhase, PhaseProgress } from '../../types/onboarding'
import { ProgressBar } from '../ui/Badge'

interface PhaseTimelineProps {
  phases: OnboardingPhase[]
  phaseProgress: PhaseProgress[]
  onPhaseSelect: (phaseId: string) => void
}

export function PhaseTimeline({
  phases,
  phaseProgress,
  onPhaseSelect,
}: PhaseTimelineProps) {
  const progressMap = new Map(phaseProgress.map((p) => [p.phaseId, p]))

  return (
    <div className="relative space-y-0">
      {phases.map((phase, index) => {
        const progress = progressMap.get(phase.id)
        const isComplete = progress?.percentage === 100
        const isLast = index === phases.length - 1

        return (
          <div key={phase.id} className="relative flex gap-4">
            {!isLast && (
              <div
                className={`absolute left-[19px] top-10 h-[calc(100%-1rem)] w-0.5 ${
                  isComplete ? 'bg-brand-400' : 'bg-slate-200'
                }`}
                aria-hidden
              />
            )}

            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  isComplete
                    ? 'border-brand-600 bg-brand-500 text-slate-900'
                    : progress && progress.completed > 0
                      ? 'border-brand-600 bg-brand-100 text-brand-800'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  phase.number
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPhaseSelect(phase.id)}
              className="mb-4 flex min-h-[72px] flex-1 items-start justify-between rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] active:bg-slate-50"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {phase.dayRange}
                </p>
                <p className="mt-0.5 font-bold text-slate-900">{phase.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{phase.subtitle}</p>
                {progress && (
                  <div className="mt-3">
                    <ProgressBar percentage={progress.percentage} />
                    <p className="mt-1 text-xs text-slate-400">
                      {progress.completed}/{progress.total} tasks
                    </p>
                  </div>
                )}
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

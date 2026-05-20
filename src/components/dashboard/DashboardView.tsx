import { CalendarDays, CheckCircle2, Target, UserRound } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext'
import { Header } from '../layout/Header'
import { ProgressBar, StatCard } from '../ui/Badge'
import { PhaseTimeline } from './PhaseTimeline'
import { MilestoneCards } from './MilestoneCards'
import { NextTaskCta } from './NextTaskCta'

export function DashboardView() {
  const {
    user,
    overallProgress,
    phaseProgress,
    relevantPhases,
    personalizedGreeting,
    personalizedDashboardSubtitle,
    setActiveTab,
    setSelectedPhaseId,
  } = useOnboarding()

  const daysSinceStart = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(user.startDate).getTime()) / (1000 * 60 * 60 * 24),
    ),
  )

  const currentPhaseIndex = phaseProgress.findIndex(
    (p) => p.percentage < 100,
  )
  const activePhase =
    currentPhaseIndex === -1
      ? relevantPhases[relevantPhases.length - 1]
      : relevantPhases[currentPhaseIndex]

  const handlePhaseSelect = (phaseId: string) => {
    setSelectedPhaseId(phaseId)
    setActiveTab('tasks')
  }

  return (
    <>
      <Header
        title={personalizedGreeting}
        subtitle={personalizedDashboardSubtitle}
      />

      <div className="space-y-6 px-4 py-4">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-300 to-brand-500 p-5 text-slate-900 shadow-lg shadow-brand-200/60">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900/70">Your progress</p>
              <p className="text-4xl font-bold">{overallProgress.percentage}%</p>
              <p className="mt-1 text-sm text-brand-900/70">
                {overallProgress.completed} of {overallProgress.total} of your tasks
                complete
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/40">
              <Target className="h-8 w-8" strokeWidth={2} />
            </div>
          </div>
          <ProgressBar
            percentage={overallProgress.percentage}
            className="!bg-brand-900/10 [&>div]:!bg-brand-800"
          />
          {activePhase && (
            <p className="mt-4 text-sm text-brand-900/80">
              Current focus:{' '}
              <span className="font-semibold text-slate-900">{activePhase.title}</span>
            </p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <StatCard
            icon={CalendarDays}
            label="Day"
            value={`Day ${daysSinceStart + 1}`}
            subtext={`Started ${new Date(user.startDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={`${overallProgress.completed}`}
            subtext="Your tasks checked off"
          />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your team
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Supervisor: {user.supervisor}
                </p>
                <p className="text-xs text-slate-500">Daily training & coaching</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Buddy: {user.buddy}
                </p>
                <p className="text-xs text-slate-500">Peer support in Week 1</p>
              </div>
            </div>
          </div>
        </section>

        <NextTaskCta />

        <MilestoneCards />

        {relevantPhases.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Your roadmap</h2>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-sm font-semibold text-brand-600 active:text-brand-800"
              >
                View all
              </button>
            </div>
            <PhaseTimeline
              phases={relevantPhases}
              phaseProgress={phaseProgress}
              onPhaseSelect={handlePhaseSelect}
            />
          </section>
        )}
      </div>
    </>
  )
}

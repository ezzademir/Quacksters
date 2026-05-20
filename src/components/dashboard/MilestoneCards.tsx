import { Bell, CalendarClock } from 'lucide-react'
import { useMilestones } from '../../context/OnboardingContext'
import { formatMilestoneDate } from '../../lib/milestones'
import { ownerColors } from '../../data/mockData'

export function MilestoneCards() {
  const milestones = useMilestones()
  const upcoming = milestones.filter((m) => m.status !== 'past').slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
        <CalendarClock className="h-5 w-5 text-brand-600" />
        Upcoming check-ins
      </h2>
      <div className="space-y-3">
        {upcoming.map((milestone) => (
          <div
            key={milestone.id}
            className={`rounded-2xl border p-4 shadow-sm ${
              milestone.status === 'today'
                ? 'border-brand-200 bg-brand-50'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{milestone.label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{milestone.method}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Bell className="h-3.5 w-3.5" />
                  {formatMilestoneDate(milestone.date)}
                  {milestone.status === 'today' && (
                    <span className="font-semibold text-brand-600"> · Today</span>
                  )}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  ownerColors[milestone.owner.split(' ')[0] as keyof typeof ownerColors] ??
                  ownerColors.ALL
                }`}
              >
                {milestone.owner}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

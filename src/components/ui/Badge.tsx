import type { LucideIcon } from 'lucide-react'
import { ownerColors, ownerLabels } from '../../data/mockData'
import type { OwnerCode } from '../../types/onboarding'

interface OwnerBadgeProps {
  owner: OwnerCode
  size?: 'sm' | 'md'
}

export function OwnerBadge({ owner, size = 'sm' }: OwnerBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold uppercase tracking-wide ${ownerColors[owner]} ${sizeClass}`}
    >
      {owner}
    </span>
  )
}

interface OwnerLabelProps {
  owner: OwnerCode
}

export function OwnerLabel({ owner }: OwnerLabelProps) {
  return (
    <span className="text-xs text-slate-500">{ownerLabels[owner]}</span>
  )
}

interface ProgressBarProps {
  percentage: number
  className?: string
}

export function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtext?: string
}

export function StatCard({ icon: Icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  )
}
